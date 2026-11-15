import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { C } from '../theme/colors';

type Props = { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean; hint?: string };
export default function SelectField({ label, value, options, onChange, disabled = false, hint }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{label.toUpperCase()}</Text>
      <Pressable disabled={disabled} onPress={() => setOpen(true)} style={{ backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 15, marginTop: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: disabled ? 0.6 : 1 }}>
        <Text style={{ color: value ? C.text : C.muted, fontSize: 14 }}>{value || `Choose ${label.toLowerCase()}`}</Text>
        <Text style={{ color: C.wine, fontWeight: '900' }}>⌄</Text>
      </Pressable>
      {!!hint && <Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>{hint}</Text>}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: C.wine, fontWeight: '900', fontSize: 18 }}>Choose {label.toLowerCase()}</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={{ color: C.wine, fontSize: 23 }}>×</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => <Pressable key={option} onPress={() => { onChange(option); setOpen(false); }} style={{ paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: value === option ? C.cream : 'transparent', borderRadius: 9 }}>
                <Text style={{ color: C.text, fontWeight: value === option ? '900' : '500' }}>{option}</Text>
              </Pressable>)}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
