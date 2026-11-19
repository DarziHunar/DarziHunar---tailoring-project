import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { aiService, type AssistantMessage } from '../services/aiService';
import { C } from '../theme/colors';

type Props = { visible: boolean; onClose: () => void };
const QUICK_PROMPTS = [
  'How do I find a tailor near me?', 'How can I save my measurements?',
  'Which fabrics can I choose?', 'How do I pay for an order?',
  'How do I update my profile photo?', 'Where can I check my orders?',
];

export default function ChatAssistant({ visible, onClose }: Props) {
  const { accessToken } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: 'Hello! I’m the DarziHunar AI assistant. Ask me about finding tailors, styles, measurements, orders or payments.' },
  ]);

  const sendQuestion = async (question: string) => {
    const value = question.trim();
    if (!value || loading) return;
    if (!accessToken) {
      setMessages((current) => [...current, { role: 'user', content: value }, { role: 'assistant', content: 'Please sign in again to use the assistant.' }]);
      setInput('');
      return;
    }
    const next = [...messages, { role: 'user' as const, content: value }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const response = await aiService.chat(next, accessToken);
      setMessages((current) => [...current, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'The assistant could not respond. Please try again.',
      }]);
    } finally { setLoading(false); }
  };

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '82%', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View><Text style={{ color: C.wine, fontSize: 18, fontWeight: '900' }}>DarziHunar AI</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>Groq-powered assistant · Ask about the app</Text></View>
          <Pressable onPress={onClose} hitSlop={10}><Text style={{ color: C.wine, fontSize: 27 }}>×</Text></Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          {messages.map((message, index) => <View key={index} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: message.role === 'user' ? C.wine : C.card, borderWidth: message.role === 'assistant' ? 1 : 0, borderColor: C.border, borderRadius: 14, padding: 12, maxWidth: '90%', marginBottom: 9 }}><Text selectable style={{ color: message.role === 'user' ? '#FFFFFF' : C.text, fontSize: 13, lineHeight: 19 }}>{message.content}</Text></View>)}
          {loading && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }}><ActivityIndicator size="small" color={C.wine} /><Text style={{ color: C.muted, fontSize: 12 }}>Thinking…</Text></View>}
          {messages.length === 1 && <View style={{ marginTop: 4, marginBottom: 10 }}>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: '800', marginBottom: 8 }}>QUICK QUESTIONS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{QUICK_PROMPTS.map((question) => <Pressable key={question} onPress={() => { void sendQuestion(question); }} style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 9 }}><Text style={{ color: C.wine, fontSize: 11, fontWeight: '700' }}>{question}</Text></Pressable>)}</View>
          </View>}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
          <TextInput value={input} onChangeText={setInput} editable={!loading} placeholder="Ask about styles, tailors, measurements…" placeholderTextColor={C.muted} onSubmitEditing={() => { void sendQuestion(input); }} returnKeyType="send" style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: C.text }} />
          <Pressable disabled={loading || !input.trim()} onPress={() => { void sendQuestion(input); }} style={{ backgroundColor: C.wine, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13, opacity: loading || !input.trim() ? 0.5 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Send</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
