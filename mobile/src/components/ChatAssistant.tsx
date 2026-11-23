import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { aiService, type AssistantMessage } from '../services/aiService';
import { C } from '../theme/colors';

type Props = { visible: boolean; onClose: () => void };
type SheetMode = 'compact' | 'expanded';
type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'divider' };

const QUICK_PROMPTS = [
  'How do I find a tailor near me?',
  'How can I save my measurements?',
  'Which fabrics can I choose?',
  'How do I pay for an order?',
  'How do I update my profile photo?',
  'Where can I check my orders?',
];

const INLINE_MARKDOWN = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
const HTML_BREAK = /<br\s*\/?\s*>/gi;

function parseTableRow(line: string): string[] | null {
  const value = line.trim();
  if (!value.includes('|')) return null;
  const withoutEdges = value.replace(/^\|/, '').replace(/\|$/, '');
  return withoutEdges.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = parseTableRow(line);
  return !!cells?.length && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
}

function isListLine(line: string): boolean {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function isStructuralLine(lines: string[], index: number): boolean {
  const line = lines[index]?.trim() ?? '';
  if (!line) return true;
  if (/^#{1,6}\s+/.test(line) || /^```/.test(line) || /^>\s?/.test(line)) return true;
  if (/^(?:---+|___+|\*\*\*+)$/.test(line) || isListLine(line)) return true;
  return !!(parseTableRow(line) && lines[index + 1] && isTableSeparator(lines[index + 1]));
}

function parseMarkdown(source: string): MarkdownBlock[] {
  // Groq may occasionally return HTML line breaks inside an otherwise valid Markdown table.
  // Keep those breaks inside table cells; outside tables, treat them as ordinary new lines.
  const lines = source.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const current = lines[index].trim();
    if (!current) {
      index += 1;
      continue;
    }

    if (/^```/.test(current)) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    const headerCells = parseTableRow(current);
    if (headerCells && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length) {
        const rowLine = lines[index].trim();
        const cells = parseTableRow(rowLine);
        if (!cells || !rowLine) break;
        rows.push(cells.map((cell) => cell.replace(HTML_BREAK, '\n').trim()));
        index += 1;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    const heading = current.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^(?:---+|___+|\*\*\*+)$/.test(current)) {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(current)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (isListLine(current)) {
      const ordered = /^\s*\d+[.)]\s+/.test(current);
      const items: string[] = [];
      while (index < lines.length && isListLine(lines[index])) {
        items.push(lines[index].replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [current];
    index += 1;
    while (index < lines.length && !isStructuralLine(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ').replace(HTML_BREAK, '\n').trim(),
    });
  }

  return blocks;
}

function renderInlineMarkdown(text: string, baseColor: string): React.ReactNode[] {
  return text.split(INLINE_MARKDOWN).filter(Boolean).map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <Text key={key} style={{ fontWeight: '900', color: baseColor }}>{part.slice(2, -2)}</Text>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <Text key={key} style={{ fontStyle: 'italic', color: baseColor }}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={key} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', backgroundColor: '#F0E8E2', color: C.wine }}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('[')) {
      const linkLabel = part.match(/^\[([^\]]+)\]\([^)]+\)$/)?.[1];
      if (linkLabel) return <Text key={key} style={{ color: C.wine, textDecorationLine: 'underline', fontWeight: '700' }}>{linkLabel}</Text>;
    }
    return <Text key={key} style={{ color: baseColor }}>{part.replace(HTML_BREAK, '\n')}</Text>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <View style={{ gap: 9, width: '100%' }}>
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;
        if (block.type === 'heading') {
          const size = block.level === 1 ? 17 : block.level === 2 ? 15 : 13;
          return (
            <Text key={key} selectable style={{ color: C.wine, fontSize: size, lineHeight: size + 6, fontWeight: '900', marginTop: block.level === 1 ? 3 : 1 }}>
              {renderInlineMarkdown(block.text, C.wine)}
            </Text>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <Text key={key} selectable style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>
              {renderInlineMarkdown(block.text, C.text)}
            </Text>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={key} style={{ gap: 6, paddingLeft: 2 }}>
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ width: 20, color: C.wine, fontSize: 13, lineHeight: 20, fontWeight: '900' }}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <Text selectable style={{ flex: 1, color: C.text, fontSize: 13, lineHeight: 20 }}>
                    {renderInlineMarkdown(item, C.text)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'quote') {
          return (
            <View key={key} style={{ borderLeftWidth: 3, borderLeftColor: C.wine, backgroundColor: '#F0E8E2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}>
              <Text selectable style={{ color: C.text, fontSize: 12, lineHeight: 19, fontStyle: 'italic' }}>
                {renderInlineMarkdown(block.text, C.text)}
              </Text>
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <ScrollView key={key} horizontal nestedScrollEnabled style={{ backgroundColor: '#2D2528', borderRadius: 10 }} contentContainerStyle={{ padding: 11 }}>
              <Text selectable style={{ color: '#FFF7EF', fontSize: 11, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{block.text}</Text>
            </ScrollView>
          );
        }

        if (block.type === 'divider') {
          return <View key={key} style={{ height: 1, backgroundColor: C.border, marginVertical: 2 }} />;
        }

        const columnWidth = block.headers.length >= 4 ? 150 : 165;
        const tableWidth = Math.max(block.headers.length * columnWidth, 260);
        const renderCell = (cell: string, rowIndex: number, cellIndex: number, isHeader: boolean) => (
          <View
            key={`cell-${rowIndex}-${cellIndex}`}
            style={{
              width: columnWidth,
              minHeight: 42,
              justifyContent: 'center',
              paddingHorizontal: 9,
              paddingVertical: 8,
              borderRightWidth: cellIndex === block.headers.length - 1 ? 0 : 1,
              borderRightColor: C.border,
            }}
          >
            <Text selectable style={{ color: isHeader ? '#FFFFFF' : C.text, fontSize: 10.5, lineHeight: 16, fontWeight: isHeader ? '900' : '400' }}>
              {renderInlineMarkdown(cell, isHeader ? '#FFFFFF' : C.text)}
            </Text>
          </View>
        );

        return (
          <View key={key} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: 'hidden' }}>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator style={{ maxWidth: '100%' }}>
              <View style={{ width: tableWidth }}>
                <View style={{ flexDirection: 'row', backgroundColor: C.wine }}>
                  {block.headers.map((header, cellIndex) => renderCell(header, -1, cellIndex, true))}
                </View>
                {block.rows.map((row, rowIndex) => (
                  <View key={`${key}-row-${rowIndex}`} style={{ flexDirection: 'row', backgroundColor: rowIndex % 2 === 0 ? C.card : '#F7F0EA', borderTopWidth: 1, borderTopColor: C.border }}>
                    {block.headers.map((_, cellIndex) => renderCell(row[cellIndex] ?? '', rowIndex, cellIndex, false))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

export default function ChatAssistant({ visible, onClose }: Props) {
  const { accessToken } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('expanded');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I’m the DarziHunar AI assistant. Ask me about finding tailors, styles, measurements, orders or payments.',
    },
  ]);

  const dragResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => dragY.stopAnimation(),
      onPanResponderMove: (_event, gesture) => {
        dragY.setValue(Math.max(-150, Math.min(150, gesture.dy)));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy < -45) setSheetMode('expanded');
        if (gesture.dy > 45) setSheetMode('compact');
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    return () => clearTimeout(timer);
  }, [visible, messages, loading, sheetMode]);

  const sendQuestion = async (question: string) => {
    const value = question.trim();
    if (!value || loading) return;

    if (!accessToken) {
      setMessages((current) => [
        ...current,
        { role: 'user', content: value },
        { role: 'assistant', content: 'Please sign in again to use the assistant.' },
      ]);
      setInput('');
      return;
    }

    const next: AssistantMessage[] = [...messages, { role: 'user', content: value }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(next, accessToken);
      setMessages((current) => [...current, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'The assistant could not respond. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const panelHeight = sheetMode === 'expanded' ? '88%' : '54%';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      navigationBarTranslucent={false}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={{
            backgroundColor: C.bg,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            height: panelHeight,
            maxHeight: 760,
            minHeight: 270,
            flexShrink: 1,
            paddingTop: 8,
            paddingHorizontal: 16,
            paddingBottom: bottomSafePadding,
            overflow: 'hidden',
            transform: [{ translateY: dragY }],
          }}
        >
          {/* Drag this handle down to compact the sheet or up to expand it. */}
          <View
            {...dragResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Drag to resize the DarziHunar AI chat panel"
            style={{ height: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <View style={{ width: 42, height: 5, borderRadius: 5, backgroundColor: '#CDBFC0' }} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              flexShrink: 0,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: C.wine, fontSize: 18, fontWeight: '900' }}>DarziHunar AI</Text>
              <Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>Groq-powered assistant · Ask about the app</Text>
            </View>
            <Pressable
              onPress={() => setSheetMode((current) => current === 'expanded' ? 'compact' : 'expanded')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={sheetMode === 'expanded' ? 'Minimize chat' : 'Expand chat'}
              style={{ paddingHorizontal: 9, paddingVertical: 5 }}
            >
              <Text style={{ color: C.wine, fontSize: 20, fontWeight: '800' }}>{sheetMode === 'expanded' ? '⌄' : '⌃'}</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close assistant">
              <Text style={{ color: C.wine, fontSize: 27 }}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 10, gap: 2 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message, index) => (
              <View
                key={`${index}-${message.role}`}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.role === 'user' ? C.wine : C.card,
                  borderWidth: message.role === 'assistant' ? 1 : 0,
                  borderColor: C.border,
                  borderRadius: 15,
                  padding: 12,
                  maxWidth: '96%',
                  marginBottom: 9,
                }}
              >
                {message.role === 'assistant' ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  <Text selectable style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 20 }}>
                    {message.content}
                  </Text>
                )}
              </View>
            ))}

            {loading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }}>
                <ActivityIndicator size="small" color={C.wine} />
                <Text style={{ color: C.muted, fontSize: 12 }}>Thinking…</Text>
              </View>
            )}

            {messages.length === 1 && (
              <View style={{ marginTop: 4, marginBottom: 10 }}>
                <Text style={{ color: C.muted, fontSize: 11, fontWeight: '800', marginBottom: 8 }}>QUICK QUESTIONS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_PROMPTS.map((question) => (
                    <Pressable
                      key={question}
                      onPress={() => { void sendQuestion(question); }}
                      style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 9 }}
                    >
                      <Text style={{ color: C.wine, fontSize: 11, fontWeight: '700' }}>{question}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              paddingTop: 10,
              paddingBottom: 2,
              minHeight: 62,
              flexShrink: 0,
              backgroundColor: C.bg,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={!loading}
              placeholder="Ask about styles, tailors, measurements…"
              placeholderTextColor={C.muted}
              onFocus={() => setSheetMode('expanded')}
              onSubmitEditing={() => { void sendQuestion(input); }}
              returnKeyType="send"
              blurOnSubmit={false}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              style={{ flex: 1, minHeight: 50, maxHeight: 100, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: C.text, fontSize: 14 }}
            />
            <Pressable
              disabled={loading || !input.trim()}
              onPress={() => { void sendQuestion(input); }}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={{ minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: C.wine, borderRadius: 12, paddingHorizontal: 16, opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Send</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
