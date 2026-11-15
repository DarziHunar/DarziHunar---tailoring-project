import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { C } from '../theme/colors';

type Message = { from: 'user' | 'bot'; text: string };
type Props = { visible: boolean; onClose: () => void };
function replyTo(question: string) {
  const q = question.toLowerCase();
  if (/tailor|nearby|4 ?km|location/.test(q)) return 'Choose Women, Men, Teenagers or Children, then select a garment. DarziHunar searches for accepting tailors in a 4 km radius using your current location. Tailors must save their shop location and select the audience they serve.';
  if (/measure/.test(q)) return 'Open Measurements to save a measurement profile. On an order, matching saved measurements can be selected and reviewed, or you can enter values manually.';
  if (/fabric|colour|color|design|style/.test(q)) return 'In Order Details, choose a fabric, colour and design type. A rotatable 3D preview appears when a matching garment GLB model is configured.';
  if (/order|payment|razorpay/.test(q)) return 'You can review your order in My Orders. Payment and checkout support may depend on the order flow currently enabled in your app.';
  if (/profile|account|photo|image/.test(q)) return 'Open My Profile to update your account details and profile image. If an image upload fails, the backend S3 signing role needs permission to upload to your user profile folder.';
  return 'I can help with finding tailors, measurements, fabrics, garment preview, orders and profile questions. Ask me about one of those topics.';
}
const QUICK_PROMPTS = [
  'How do I find a tailor near me?',
  'How can I save my measurements?',
  'Which fabrics can I choose?',
  'How does the 3D garment preview work?',
  'How do I update my profile photo?',
  'Where can I check my orders?',
];

export default function ChatAssistant({ visible, onClose }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ from: 'bot', text: 'Hello! I’m the DarziHunar assistant. Choose a question below or type your own.' }]);

  const sendQuestion = (question: string) => {
    const value = question.trim();
    if (!value) return;
    setMessages((current) => [...current, { from: 'user', text: value }, { from: 'bot', text: replyTo(value) }]);
    setInput('');
  };

  const send = () => sendQuestion(input);

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '78%', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View><Text style={{ color: C.wine, fontSize: 18, fontWeight: '900' }}>DarziHunar Assistant</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>Instant help · Basic FAQ assistant</Text></View>
          <Pressable onPress={onClose} hitSlop={10}><Text style={{ color: C.wine, fontSize: 27 }}>×</Text></Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          {messages.map((message, index) => <View key={index} style={{ alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start', backgroundColor: message.from === 'user' ? C.wine : C.card, borderWidth: message.from === 'bot' ? 1 : 0, borderColor: C.border, borderRadius: 14, padding: 12, maxWidth: '88%', marginBottom: 9 }}><Text style={{ color: message.from === 'user' ? '#FFFFFF' : C.text, fontSize: 13, lineHeight: 19 }}>{message.text}</Text></View>)}
          {messages.length === 1 && (
            <View style={{ marginTop: 4, marginBottom: 10 }}>
              <Text style={{ color: C.muted, fontSize: 11, fontWeight: '800', marginBottom: 8 }}>QUICK QUESTIONS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_PROMPTS.map((question) => (
                  <Pressable key={question} onPress={() => sendQuestion(question)} style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 9 }}>
                    <Text style={{ color: C.wine, fontSize: 11, fontWeight: '700' }}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
          <TextInput value={input} onChangeText={setInput} placeholder="Ask about styles, tailors, measurements…" placeholderTextColor={C.muted} onSubmitEditing={send} returnKeyType="send" style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: C.text }} />
          <Pressable onPress={send} style={{ backgroundColor: C.wine, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13 }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Send</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
