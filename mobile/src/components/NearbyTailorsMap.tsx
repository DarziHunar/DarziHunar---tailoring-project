import React from 'react';
import { Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { Coordinates } from '../services/locationService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';

const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (accessToken) MapboxGL.setAccessToken(accessToken);

type Props = { center: Coordinates; tailors: TailorProfile[] };

export default function NearbyTailorsMap({ center, tailors }: Props) {
  if (!accessToken) {
    return (
      <View style={{ height: 190, borderRadius: 16, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 18, marginTop: 12 }}>
        <Text style={{ color: C.wine, fontWeight: '800' }}>Mapbox token required</Text>
        <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 5 }}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in the mobile environment and rebuild the development app.</Text>
      </View>
    );
  }

  return (
    <View style={{ height: 250, overflow: 'hidden', borderRadius: 16, marginTop: 12 }}>
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Street} logoEnabled={false}>
        <MapboxGL.Camera centerCoordinate={[center.longitude, center.latitude]} zoomLevel={12.2} animationMode="flyTo" />
        <MapboxGL.UserLocation visible />
        {tailors.filter((tailor) => Number.isFinite(tailor.latitude) && Number.isFinite(tailor.longitude)).map((tailor) => (
          <MapboxGL.PointAnnotation key={String(tailor.id)} id={`tailor-${tailor.id}`} coordinate={[Number(tailor.longitude), Number(tailor.latitude)]}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.wine, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>✂</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}
