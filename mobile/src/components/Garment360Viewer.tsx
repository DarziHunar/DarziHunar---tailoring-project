import React from 'react';
import { Platform, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../theme/colors';

type Props = { title: string; modelUrl?: string };

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export default function Garment360Viewer({ title, modelUrl }: Props) {
  if (!modelUrl || Platform.OS === 'web') {
    return (
      <View style={{ height: 190, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 18, marginTop: 10 }}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>360° garment preview</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 6 }}>A 3D GLB model for {title} has not been configured yet. Add a hosted model URL to enable drag-to-rotate viewing.</Text>
      </View>
    );
  }

  const safeUrl = escapeAttribute(modelUrl);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:#f3e9dc;font-family:Arial}model-viewer{width:100%;height:100%;background:#f3e9dc;--poster-color:#f3e9dc}</style><script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script></head><body><model-viewer src="${safeUrl}" camera-controls auto-rotate rotation-per-second="18deg" shadow-intensity="0.8" exposure="1" alt="${escapeAttribute(title)} 3D garment model"></model-viewer></body></html>`;
  return <View style={{ height: 280, overflow: 'hidden', borderRadius: 15, marginTop: 10 }}><WebView source={{ html }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback /></View>;
}
