import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { notificationsService, type AppNotification } from '../services/notificationService';
import { Alert } from '../utils/appAlert';
import { C } from '../theme/colors';

type Props = { onBack: () => void };
const dateLabel = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

export default function NotificationsPage({ onBack }: Props) {
    const { accessToken } = useAuth();
    const [items, setItems] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!accessToken) return;
        try { setItems(await notificationsService.list(accessToken)); }
        catch (error) { Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please try again.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [accessToken]);

    useEffect(() => { void load(); }, [load]);

    const markRead = async (item: AppNotification) => {
        if (!accessToken || item.readAt) return;
        try {
            await notificationsService.markRead(item.id, accessToken);
            setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
        } catch (error) { Alert.alert('Could not update notification', error instanceof Error ? error.message : 'Please try again.'); }
    };

    const markAllRead = async () => {
        if (!accessToken) return;
        try {
            await notificationsService.markAllRead(accessToken);
            setItems((current) => current.map((entry) => ({ ...entry, readAt: entry.readAt || new Date().toISOString() })));
        } catch (error) { Alert.alert('Could not update notifications', error instanceof Error ? error.message : 'Please try again.'); }
    };

    const unread = items.filter((item) => !item.readAt).length;
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.border }}>
                <Pressable onPress={onBack} style={{ paddingRight: 14 }}><Text style={{ color: C.wine, fontSize: 28 }}>‹</Text></Pressable>
                <View style={{ flex: 1 }}><Text style={{ color: C.wine, fontSize: 22, fontWeight: '900' }}>Notifications</Text><Text style={{ color: C.muted, fontSize: 11 }}>{unread} unread</Text></View>
                <Pressable onPress={markAllRead} disabled={!unread}><Text style={{ color: unread ? C.wine : C.muted, fontSize: 12, fontWeight: '800' }}>Mark all read</Text></Pressable>
            </View>
            {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={C.wine} /> : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
                    {!items.length ? <View style={{ padding: 26, alignItems: 'center' }}><Text style={{ fontSize: 32 }}>♧</Text><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16, marginTop: 8 }}>You're all caught up</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Order requests, quotes and updates will appear here.</Text></View> : items.map((item) => (
                        <Pressable key={item.id} onPress={() => { void markRead(item); }} style={{ backgroundColor: item.readAt ? C.card : '#FFF8EF', borderColor: item.readAt ? C.border : C.gold, borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: item.readAt ? 'transparent' : C.wine }} /><Text style={{ flex: 1, color: C.wine, fontSize: 14, fontWeight: '900' }}>{item.title}</Text></View>
                            <Text style={{ color: C.text, fontSize: 13, lineHeight: 19, marginTop: 7 }}>{item.body}</Text>
                            <Text style={{ color: C.muted, fontSize: 10, marginTop: 9 }}>{dateLabel(item.createdAt)} · {item.readAt ? 'Read' : 'Tap to mark as read'}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
