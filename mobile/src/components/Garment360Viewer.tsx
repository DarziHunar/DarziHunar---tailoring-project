import React from 'react';
import { Platform, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../theme/colors';

type Props = { title: string; modelUrl?: string; color: string; designType: string };

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function Garment360Viewer({ title, modelUrl, color, designType }: Props) {
  if (!modelUrl || Platform.OS === 'web') {
    return (
      <View style={{ height: 270, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 10 }}>
        <Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>3D garment model not configured</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 8 }}>The colour and design are saved with the order. To render a rotatable garment here, host a licensed GLB for {title} and set EXPO_PUBLIC_GARMENT_3D_BASE_URL. The model must expose garment materials and the {designType} variant.</Text>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: color, marginTop: 14, borderWidth: 1, borderColor: C.border }} />
      </View>
    );
  }

  const safeUrl = escapeHtml(modelUrl);
  const safeTitle = escapeHtml(title);
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#5B1F32';
  const safeDesign = escapeHtml(designType);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f3e9dc;font-family:Arial}model-viewer{width:100%;height:100%;background:#f3e9dc;--poster-color:#f3e9dc}#hint{position:absolute;left:8px;right:8px;bottom:8px;padding:6px 9px;background:#ffffffd9;border-radius:9px;color:#5b1f32;font-size:11px;text-align:center}</style><script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script></head><body><model-viewer id="garment" src="${safeUrl}" camera-controls auto-rotate rotation-per-second="18deg" shadow-intensity="0.8" exposure="1" interaction-prompt="auto" alt="${safeTitle} 3D garment model"></model-viewer><div id="hint">Drag to rotate · Pinch to zoom</div><script>
const viewer=document.getElementById('garment');
const selectedColor='${safeColor}';
const selectedVariant='${safeDesign}';
function toRgba(hex){return [parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255,1]}
function applyCustomization(){
  if(!viewer.model)return;
  let changed=0;
  for(const material of viewer.model.materials){
    const materialName=(material.name||'').toLowerCase();
    if(/garment|fabric|cloth|shirt|dress|kurta|outfit|coat|jacket|trouser|blouse/.test(materialName)){
      material.pbrMetallicRoughness.setBaseColorFactor(toRgba(selectedColor));
      changed++;
    }
  }
  const variants=viewer.availableVariants||[];
  if(variants.includes(selectedVariant)){viewer.variantName=selectedVariant;}
  else if(variants.length){viewer.variantName=variants[0];}
  const hint=document.getElementById('hint');
  if(hint){hint.textContent=(changed?'Colour applied to '+changed+' garment material(s)':'Model loaded; name garment materials with "fabric" or "garment" to enable recolouring')+' · '+(variants.includes(selectedVariant)?selectedVariant+' design':(variants.length?'Default model variant':'Design variant requires GLB material variants'));}
}
viewer.addEventListener('load',applyCustomization);
viewer.addEventListener('model-visibility',applyCustomization);
</script></body></html>`;
  return <View style={{ height: 330, overflow: 'hidden', borderRadius: 15, marginTop: 10 }}><WebView source={{ html }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback setSupportMultipleWindows={false} /></View>;
}
