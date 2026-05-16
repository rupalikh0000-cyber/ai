import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatMessage from '@/components/ChatMessage';
import OrbAnimationView from '@/components/OrbAnimationView';
import WaveformView from '@/components/WaveformView';
import { useResma } from '@/context/ResmaContext';
import { ChatMessage as ChatMessageType } from '@/model/AppCommand';

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages, orbState, statusText, isConnected,
    isMuted, toggleMute,
    sendText, startRecording, stopRecording, interrupt,
    amplitude, settings,
  } = useResma();

  const [time, setTime] = useState(formatTime(new Date()));
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Red overlay effect
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const active = orbState === 'speaking' || orbState === 'listening' || orbState === 'thinking';
    Animated.timing(overlayAnim, {
      toValue: active ? 0.08 : 0,
      duration: active ? 300 : 500,
      useNativeDriver: true,
    }).start();
  }, [orbState]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime(new Date())), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendText(inputText);
    setInputText('');
    Keyboard.dismiss();
  }, [inputText, sendText]);

  const handleMicPress = useCallback(async () => {
    if (orbState === 'speaking') {
      interrupt();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (isRecording) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRecording(true);
    await startRecording();
  }, [orbState, isRecording, startRecording, interrupt]);

  const handleMicRelease = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    await stopRecording();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isRecording, stopRecording]);

  const renderMessage = ({ item }: { item: ChatMessageType }) => (
    <ChatMessage message={item} />
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={['#050505', '#0A0005', '#050505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Corner glow accents */}
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowBottomRight} pointerEvents="none" />

      {/* Red active overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.redOverlay, { opacity: overlayAnim }]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
          <View style={styles.topLeft}>
            <Text style={styles.timeText}>{time}</Text>
            <Text style={styles.statusDot}>
              {isConnected ? '● LIVE' : '○ OFF'}
            </Text>
          </View>

          <View style={styles.topCenter}>
            <Text style={styles.titleText}>RESMA</Text>
            <Text style={styles.subtitleText}>AI COMPANION</Text>
          </View>

          <View style={styles.topRight}>
            <TouchableOpacity onPress={toggleMute} style={styles.iconBtn}>
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={20}
                color={isMuted ? '#555' : '#FF1744'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Orb section */}
        <View style={styles.orbSection}>
          <OrbAnimationView state={orbState} amplitude={amplitude} size={200} />

          <WaveformView
            amplitude={amplitude}
            isActive={orbState === 'listening' || orbState === 'speaking'}
            color="#FF1744"
            height={36}
            width={180}
          />

          <Text style={styles.statusText}>{statusText}</Text>

          {!settings.apiKey && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.setupBtn}>
              <Text style={styles.setupBtnText}>Set API Key to Start</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chat */}
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!messages.length}
            contentContainerStyle={styles.chatContent}
          />
        </View>

        {/* Bottom input bar */}
        <View style={[styles.inputBar, { paddingBottom: botPad + 12 }]}>
          {/* Glass input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#444"
              selectionColor="#FF1744"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={false}
            />
            {inputText.length > 0 && (
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#FF1744" />
              </TouchableOpacity>
            )}
          </View>

          {/* Mic button */}
          <Pressable
            onPressIn={handleMicPress}
            onPressOut={handleMicRelease}
            style={({ pressed }) => [
              styles.micBtn,
              isRecording && styles.micBtnRecording,
              pressed && styles.micBtnPressed,
            ]}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : orbState === 'speaking' ? 'hand-left' : 'mic'}
              size={26}
              color={isRecording ? '#FF1744' : '#FFFFFF'}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  glowTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(183,28,28,0.12)',
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(213,0,249,0.08)',
  },
  redOverlay: {
    backgroundColor: '#FF1744',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topLeft: { flex: 1, alignItems: 'flex-start' },
  topCenter: { flex: 2, alignItems: 'center' },
  topRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  timeText: {
    color: '#FF1744',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    letterSpacing: 1,
  },
  statusDot: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  titleText: {
    color: '#FF1744',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: 4,
  },
  subtitleText: {
    color: '#555',
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  orbSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  statusText: {
    color: '#666',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  setupBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.4)',
    backgroundColor: 'rgba(255,23,68,0.08)',
  },
  setupBtnText: {
    color: '#FF1744',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  chatContainer: {
    flex: 1,
    maxHeight: 200,
  },
  chatContent: {
    paddingVertical: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5,5,5,0.9)',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: '#EEEEEE',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    padding: 6,
  },
  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,23,68,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,23,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: 'rgba(255,23,68,0.25)',
    borderColor: '#FF1744',
  },
  micBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
