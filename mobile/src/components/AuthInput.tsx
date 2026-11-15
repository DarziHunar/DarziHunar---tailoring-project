import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { C } from '../theme/colors';

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
};

export default function AuthInput({
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        marginBottom: 14,
        paddingRight: secure ? 12 : 0,
      }}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !visible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        style={{ flex: 1, padding: 15, color: C.text }}
        returnKeyType="next"
      />
      {secure && (
        <Pressable
          onPress={() => setVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={8}
          style={{ paddingHorizontal: 6, paddingVertical: 10 }}
        >
          <FontAwesome name={visible ? 'eye-slash' : 'eye'} size={18} color={C.wine} />
        </Pressable>
      )}
    </View>
  );
}
