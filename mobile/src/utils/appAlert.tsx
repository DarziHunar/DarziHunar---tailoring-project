import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { C } from '../theme/colors';

type AlertButton = { text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type AlertOptions = { cancelable?: boolean };
type AlertRequest = { title: string; message?: string; buttons: AlertButton[]; cancelable: boolean };
type AlertHandler = (request: AlertRequest) => void;
let activeHandler: AlertHandler | null = null;

/** Compatible replacement for React Native Alert.alert, rendered as a themed cross-platform dialog. */
export const Alert = {
    alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
        const normalized = buttons?.length ? buttons : [{ text: 'OK' }];
        activeHandler?.({ title, message, buttons: normalized, cancelable: options?.cancelable !== false });
    },
};

export function AppAlertProvider({ children }: React.PropsWithChildren) {
    const [request, setRequest] = useState<AlertRequest | null>(null);
    const handler = useCallback<AlertHandler>((next) => setRequest(next), []);

    useEffect(() => {
        activeHandler = handler;
        return () => { if (activeHandler === handler) activeHandler = null; };
    }, [handler]);

    const close = useCallback((button?: AlertButton) => {
        setRequest(null);
        if (button?.onPress) setTimeout(() => button.onPress?.(), 0);
    }, []);

    return (
        <>
            {children}
            <Modal visible={request !== null} transparent animationType="fade" onRequestClose={() => { if (request?.cancelable) close(); }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(25, 14, 18, 0.58)', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '78%', width: '100%', maxWidth: 480, alignSelf: 'center' }}>
                        <View style={{ width: 42, height: 4, backgroundColor: C.gold, borderRadius: 4, marginBottom: 15 }} />
                        <Text style={{ color: C.wine, fontSize: 19, fontWeight: '900' }}>{request?.title ?? ''}</Text>
                        {!!request?.message && <ScrollView style={{ maxHeight: 300, marginTop: 10 }}><Text selectable style={{ color: C.text, fontSize: 14, lineHeight: 21 }}>{request.message}</Text></ScrollView>}
                        <View style={{ flexDirection: request?.buttons.length === 2 ? 'row' : 'column', justifyContent: 'flex-end', gap: 9, marginTop: 18 }}>
                            {request?.buttons.map((button, index) => {
                                const destructive = button.style === 'destructive';
                                const cancel = button.style === 'cancel';
                                return (
                                    <Pressable key={`${button.text ?? 'button'}-${index}`} onPress={() => close(button)} style={{ flex: request?.buttons.length === 2 ? 1 : undefined, minWidth: request?.buttons.length === 2 ? 0 : '100%', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 12, alignItems: 'center', borderWidth: cancel ? 1 : 0, borderColor: C.border, backgroundColor: cancel ? C.cream : destructive ? '#A32D36' : C.wine }}>
                                        <Text style={{ color: cancel ? C.wine : '#FFFFFF', fontWeight: '900', fontSize: 13 }}>{button.text || 'OK'}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
