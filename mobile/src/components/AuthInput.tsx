import React from "react";
import { TextInput } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { C } from "../theme/colors";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
};

export default function AuthInput({
  placeholder, value, onChangeText, secure = false, keyboardType = "default",
  autoCapitalize = "none", autoComplete,
}: Props) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      style={{
        backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
        borderRadius: 12, padding: 15, marginBottom: 14, color: C.text,
      }}
      returnKeyType="next"
    />
  );
}
