import React from 'react';
import { Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { Coordinates } from '../services/locationService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';

const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (accessToken) MapboxGL.setAccessToken(accessToken);

type Props = { center: Coordinates; tailors: TailorProfile[]; onSelect?: (tailor: TailorProfile) => void };

function createRadiusCircle(center: Coordinates) {
    const earthRadiusMeters = 6378137;
    const angularDistance = 4000 / earthRadiusMeters;
    const latitude = center.latitude * Math.PI / 180;
    const longitude = center.longitude * Math.PI / 180;
    const coordinates: [number, number][] = [];

    for (let step = 0; step <= 64; step += 1) {
        const bearing = (step / 64) * 2 * Math.PI;
        const destinationLatitude = Math.asin(
            Math.sin(latitude) * Math.cos(angularDistance) +
            Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
        );
        const destinationLongitude = longitude + Math.atan2(
            Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
            Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude),
        );
        coordinates.push([
            destinationLongitude * 180 / Math.PI,
            destinationLatitude * 180 / Math.PI,
        ]);
    }

    return {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [coordinates] },
    };
}

export default function NearbyTailorsMap({ center, tailors, onSelect }: Props) {
    const radiusCircle = createRadiusCircle(center);
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
                <MapboxGL.Camera centerCoordinate={[center.longitude, center.latitude]} zoomLevel={11.8} animationMode="flyTo" />
                <MapboxGL.UserLocation visible />
                <MapboxGL.ShapeSource id="nearby-radius-source" shape={radiusCircle}>
                    <MapboxGL.FillLayer id="nearby-radius-fill" style={{ fillColor: C.wine, fillOpacity: 0.07 }} />
                    <MapboxGL.LineLayer id="nearby-radius-line" style={{ lineColor: C.wine, lineWidth: 1.5, lineOpacity: 0.75, lineDasharray: [2, 2] }} />
                </MapboxGL.ShapeSource>
                {tailors.filter((tailor) => Number.isFinite(tailor.latitude) && Number.isFinite(tailor.longitude)).map((tailor) => (
                    <MapboxGL.PointAnnotation key={String(tailor.id)} id={`tailor-${tailor.id}`} coordinate={[Number(tailor.longitude), Number(tailor.latitude)]} onSelected={() => onSelect?.(tailor)}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.wine, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>✂</Text>
                        </View>
                    </MapboxGL.PointAnnotation>
                ))}
            </MapboxGL.MapView>
        </View>
    );
}
