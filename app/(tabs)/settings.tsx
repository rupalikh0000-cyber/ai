import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResma } from '@/context/ResmaContext';
import { PersonalityMode, PrimeContact } from '@/model/AppCommand';

const MODELS = [
  { label: 'Native Audio (Human Voice)', value: 'models/gemini-2.5-flash-native-audio-preview-12-2025' },
  { label: 'Flash Live (Fast)', value: 'models/gemini-2.0-flash-live-001' },
  { label: 'Pro Audio Dialog', value: 'models/gemini-2.5-flash-preview-native-audio-dialog' },
];

const VOICES = [
  { label: 'Aoede (Female)', value: 'Aoede' },
  { label: 'Charon (Male)', value: 'Charon' },
  { label: 'Kore (Female)', value: 'Kore' },
  { label: 'Fenrir (Male)', value: 'Fenrir' },
  { label: 'Puck (Male)', value: 'Puck' },
  { label: 'Leda (Female)', value: 'Leda' },
  { label: 'Orus (Male)', value: 'Orus' },
  { label: 'Zephyr (Female)', value: 'Zephyr' },
];

const PERSONALITIES: { label: string; desc: string; value: PersonalityMode }[] = [
  { label: 'GF Mode', desc: 'Warm Hinglish companion', value: 'gf' },
  { label: 'Professional', desc: 'Formal & precise English', value: 'professional' },
  { label: 'Assistant', desc: 'Friendly & balanced', value: 'assistant' },
];

function GlassSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>{title}</Text>
        <BlurView intensity={10} tint="dark" style={s.sectionCard}>
          <View style={s.sectionInner}>{children}</View>
        </BlurView>
      </View>
    );
  }
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={[s.sectionCard, s.sectionCardWeb]}>
        <View style={s.sectionInner}>{children}</View>
      </View>
    </View>
  );
}

function Picker<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.pickerWrap}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[s.pickerOption, value === opt.value && s.pickerOptionActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[s.pickerLabel, value === opt.value && s.pickerLabelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, saveSettings } = useResma();

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [userName, setUserName] = useState(settings.userName);
  const [model, setModel] = useState(settings.model);
  const [voice, setVoice] = useState(settings.voice);
  const [personality, setPersonality] = useState<PersonalityMode>(settings.personality);
  const [primeContacts, setPrimeContacts] = useState<PrimeContact[]>(settings.primeContacts);

  // Add contact modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setUserName(settings.userName);
    setModel(settings.model);
    setVoice(settings.voice);
    setPersonality(settings.personality);
    setPrimeContacts(settings.primeContacts);
  }, [settings]);

  const handleSave = useCallback(async () => {
    await saveSettings({ apiKey, userName, model, voice, personality, primeContacts });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [apiKey, userName, model, voice, personality, primeContacts, saveSettings]);

  const handleAddContact = useCallback(() => {
    if (!newName.trim() || !newNumber.trim()) {
      Alert.alert('Required', 'Please enter both name and number');
      return;
    }
    setPrimeContacts((prev) => [...prev, { name: newName.trim(), number: newNumber.trim() }]);
    setNewName('');
    setNewNumber('');
    setShowAddModal(false);
  }, [newName, newNumber]);

  const handleDeleteContact = useCallback((index: number) => {
    setPrimeContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#080005', '#050505', '#00040A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-down" size={24} color="#888" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* API Key */}
        <GlassSection title="GEMINI API KEY">
          <TextInput
            style={s.textInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="AIzaSy..."
            placeholderTextColor="#333"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#FF1744"
          />
          <Text style={s.hint}>Get your key at aistudio.google.com</Text>
        </GlassSection>

        {/* Your name */}
        <GlassSection title="YOUR NAME">
          <TextInput
            style={s.textInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your name"
            placeholderTextColor="#333"
            autoCapitalize="words"
            selectionColor="#FF1744"
          />
        </GlassSection>

        {/* Personality */}
        <GlassSection title="PERSONALITY">
          <View style={s.personalityRow}>
            {PERSONALITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[s.personalityBtn, personality === p.value && s.personalityBtnActive]}
                onPress={() => setPersonality(p.value)}
              >
                <Text style={[s.personalityLabel, personality === p.value && s.personalityLabelActive]}>
                  {p.label}
                </Text>
                <Text style={s.personalityDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassSection>

        {/* AI Model */}
        <GlassSection title="AI MODEL">
          <Picker options={MODELS} value={model} onChange={setModel} />
        </GlassSection>

        {/* Voice */}
        <GlassSection title="VOICE">
          <Picker options={VOICES} value={voice} onChange={setVoice} />
        </GlassSection>

        {/* Prime Contacts */}
        <GlassSection title="PRIME CONTACTS">
          {primeContacts.length === 0 && (
            <Text style={s.emptyText}>No prime contacts added</Text>
          )}
          {primeContacts.map((contact, i) => (
            <View key={i} style={s.contactRow}>
              <View style={s.contactDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>{contact.name}</Text>
                <Text style={s.contactNumber}>{contact.number}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteContact(i)} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color="#FF1744" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addContactBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={18} color="#FF1744" />
            <Text style={s.addContactText}>Add Prime Contact</Text>
          </TouchableOpacity>
        </GlassSection>
      </ScrollView>

      {/* Save button */}
      <View style={[s.saveBar, { paddingBottom: botPad + 12 }]}>
        <TouchableOpacity style={[s.saveBtn, saved && s.saveBtnDone]} onPress={handleSave} activeOpacity={0.8}>
          <LinearGradient
            colors={saved ? ['#00E676', '#00C853'] : ['#FF1744', '#D500F9']}
            style={s.saveBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.saveBtnText}>{saved ? 'Saved!' : 'Save Settings'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add contact modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={s.modalCard}>
            <View style={s.modalInner}>
              <Text style={s.modalTitle}>Add Prime Contact</Text>
              <TextInput
                style={s.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Name"
                placeholderTextColor="#333"
                autoCapitalize="words"
                selectionColor="#FF1744"
              />
              <View style={{ height: 10 }} />
              <TextInput
                style={s.textInput}
                value={newNumber}
                onChangeText={setNewNumber}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#333"
                keyboardType="phone-pad"
                selectionColor="#FF1744"
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalAddBtn} onPress={handleAddContact}>
                  <Text style={s.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#EEEEEE',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: { gap: 8 },
  sectionTitle: {
    color: '#555',
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 2.5,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionCardWeb: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionInner: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#EEEEEE',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hint: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 6,
  },
  personalityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personalityBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  personalityBtnActive: {
    borderColor: 'rgba(255,23,68,0.5)',
    backgroundColor: 'rgba(255,23,68,0.1)',
  },
  personalityLabel: {
    color: '#888',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  personalityLabelActive: { color: '#FF1744' },
  personalityDesc: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 3,
  },
  pickerWrap: { gap: 6 },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pickerOptionActive: {
    borderColor: 'rgba(255,23,68,0.45)',
    backgroundColor: 'rgba(255,23,68,0.09)',
  },
  pickerLabel: {
    color: '#888',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  pickerLabelActive: {
    color: '#FF1744',
    fontFamily: 'Inter_500Medium',
  },
  emptyText: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  contactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1744',
  },
  contactName: {
    color: '#EEEEEE',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  contactNumber: {
    color: '#555',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  deleteBtn: { padding: 6 },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.3)',
    backgroundColor: 'rgba(255,23,68,0.06)',
  },
  addContactText: {
    color: '#FF1744',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  saveBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5,5,5,0.95)',
  },
  saveBtn: { borderRadius: 14, overflow: 'hidden' },
  saveBtnDone: {},
  saveBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalInner: {
    padding: 24,
    backgroundColor: 'rgba(5,5,5,0.6)',
  },
  modalTitle: {
    color: '#EEEEEE',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#888',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF1744',
    alignItems: 'center',
  },
  modalAddText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});
