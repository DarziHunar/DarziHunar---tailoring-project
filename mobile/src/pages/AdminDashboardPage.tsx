import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { adminService, type AdminRole, type AdminSection } from '../services/adminService';
import { Alert } from '../utils/appAlert';
import { C } from '../theme/colors';

type Props = { onSignOut: () => void; onNotifications: () => void };
type AdminData = { users: any[]; orders: any[]; tailors: any[]; reviews: any[]; measurements: any[] };
const EMPTY: AdminData = { users: [], orders: [], tailors: [], reviews: [], measurements: [] };
const sections: { key: AdminSection; label: string }[] = [
    { key: 'overview', label: 'Overview' }, { key: 'users', label: 'Users' },
    { key: 'orders', label: 'Orders' }, { key: 'tailors', label: 'Tailors' },
    { key: 'reviews', label: 'Reviews' }, { key: 'measurements', label: 'Measurements' },
];
const allowedNext: Record<string, string[]> = {
    PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'IN_PROGRESS'],
};
const nice = (value: unknown) => String(value ?? '—').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function Action({ label, onPress, danger = false, disabled = false }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
    return <Pressable disabled={disabled} onPress={onPress} style={{ backgroundColor: danger ? '#A32D36' : C.wine, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, opacity: disabled ? 0.45 : 1 }}><Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{label}</Text></Pressable>;
}
function Panel({ children }: React.PropsWithChildren) {
    return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 11 }}>{children}</View>;
}
function Stat({ label, value }: { label: string; value: number | string }) {
    return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 13, flexBasis: '47%', flexGrow: 1 }}><Text style={{ color: C.muted, fontSize: 11 }}>{label}</Text><Text style={{ color: C.wine, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{value}</Text></View>;
}

export default function AdminDashboardPage({ onSignOut, onNotifications }: Props) {
    const { accessToken, user } = useAuth();
    const [section, setSection] = useState<AdminSection>('overview');
    const [data, setData] = useState<AdminData>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!accessToken) return;
        setError('');
        const [users, orders, tailors, reviews, measurements] = await Promise.allSettled([
            adminService.users(accessToken), adminService.orders(accessToken), adminService.tailors(accessToken),
            adminService.reviews(accessToken), adminService.measurements(accessToken),
        ]);
        const failures = [users, orders, tailors, reviews, measurements].filter((item) => item.status === 'rejected').length;
        setData({
            users: users.status === 'fulfilled' && Array.isArray(users.value) ? users.value : [],
            orders: orders.status === 'fulfilled' && Array.isArray(orders.value) ? orders.value : [],
            tailors: tailors.status === 'fulfilled' && Array.isArray(tailors.value) ? tailors.value : [],
            reviews: reviews.status === 'fulfilled' && Array.isArray(reviews.value) ? reviews.value : [],
            measurements: measurements.status === 'fulfilled' && Array.isArray(measurements.value) ? measurements.value : [],
        });
        if (failures) setError(`${failures} admin section(s) could not be loaded. Check that all migrations are applied and your admin token has access.`);
        setLoading(false); setRefreshing(false);
    }, [accessToken]);
    useEffect(() => { void load(); }, [load]);

    const perform = async (action: () => Promise<unknown>) => {
        setBusy(true);
        try { await action(); await load(); }
        catch (err) { Alert.alert('Admin action failed', err instanceof Error ? err.message : 'Please try again.'); }
        finally { setBusy(false); }
    };
    const confirm = (title: string, message: string, action: () => Promise<unknown>) => {
        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', style: 'destructive', onPress: () => { void perform(action); } },
        ]);
    };

    const stats = useMemo(() => ({
        customers: data.users.filter((item) => item.role === 'CUSTOMER').length,
        tailors: data.tailors.length,
        pending: data.orders.filter((item) => item.status === 'PENDING').length,
        grossPaid: data.orders.reduce((sum, order) => sum + (Array.isArray(order.payments) ? order.payments.filter((payment: any) => payment.status === 'SUCCESS').reduce((v: number, payment: any) => v + Number(payment.amount || 0), 0) : 0), 0),
    }), [data]);

    const renderOverview = () => <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 }}>
            <Stat label="All users" value={data.users.length} /><Stat label="Tailor profiles" value={stats.tailors} />
            <Stat label="All orders" value={data.orders.length} /><Stat label="Pending requests" value={stats.pending} />
        </View>
        <Panel><Text style={{ color: C.wine, fontWeight: '900', fontSize: 15 }}>Platform snapshot</Text>
            <Text style={{ color: C.text, fontSize: 12, marginTop: 8 }}>Customers: {stats.customers}</Text>
            <Text style={{ color: C.text, fontSize: 12, marginTop: 5 }}>Reviews: {data.reviews.length}</Text>
            <Text style={{ color: C.text, fontSize: 12, marginTop: 5 }}>Saved measurement profiles: {data.measurements.length}</Text>
            <Text style={{ color: C.text, fontSize: 12, marginTop: 5 }}>Recorded successful payment total: ₹{stats.grossPaid.toLocaleString('en-IN')}</Text>
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 8 }}>Payment total is calculated from successful payments currently returned with orders. This is an operational summary, not an accounting settlement report.</Text>
        </Panel>
        <Panel><Text style={{ color: C.wine, fontWeight: '900', fontSize: 15, marginBottom: 8 }}>Recent orders</Text>
            {data.orders.slice(0, 6).map((order) => <View key={order.id} style={{ paddingVertical: 9, borderTopWidth: 1, borderColor: C.border }}><Text style={{ color: C.text, fontWeight: '800', fontSize: 12 }}>Order #{order.id} · {nice(order.status)}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{order.tailor?.shopName || 'Tailor'} · {order.customer?.email || 'Customer'}</Text></View>)}
            {!data.orders.length && <Text style={{ color: C.muted, fontSize: 12 }}>No orders yet.</Text>}
        </Panel>
    </>;

    const renderUsers = () => data.users.map((item) => <Panel key={item.id}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>#{item.id} · {item.fullName || 'Unnamed user'}</Text>
        <Text style={{ color: C.text, fontSize: 12, marginTop: 4 }}>{item.email}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{item.phoneNumber || 'No phone'} · {nice(item.role)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {(['CUSTOMER', 'TAILOR', 'ADMIN'] as AdminRole[]).filter((role) => role !== item.role).map((role) => <Action key={role} label={`Set ${nice(role)}`} disabled={busy} onPress={() => confirm('Change user role?', `Change ${item.email} from ${item.role} to ${role}?`, () => adminService.updateUserRole(item.id, role, accessToken!))} />)}
            {item.role !== 'ADMIN' && <Action label="Delete user" danger disabled={busy} onPress={() => confirm('Delete user?', `Delete ${item.email}? This may be blocked if linked orders or other records still exist.`, () => adminService.deleteUser(item.id, accessToken!))} />}
        </View>
    </Panel>);

    const renderOrders = () => data.orders.map((order) => <Panel key={order.id}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>Order #{order.id} · {nice(order.status)}</Text>
        <Text style={{ color: C.text, fontSize: 12, marginTop: 4 }}>{order.customer?.email || 'Customer'} → {order.tailor?.shopName || 'Tailor'}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Quote: ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')} · Payments: {(order.payments || []).map((p: any) => nice(p.status)).join(', ') || 'None'}</Text>
        {Array.isArray(allowedNext[order.status]) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>{allowedNext[order.status].map((status) => <Action key={status} label={nice(status)} disabled={busy} onPress={() => confirm('Update order status?', `Set order #${order.id} to ${nice(status)}?`, () => adminService.updateOrderStatus(order.id, status, accessToken!))} />)}</View>}
    </Panel>);

    const renderTailors = () => data.tailors.map((tailor) => <Panel key={tailor.id}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>#{tailor.id} · {tailor.shopName}</Text>
        <Text style={{ color: C.text, fontSize: 12, marginTop: 4 }}>{tailor.user?.email || 'Tailor account'}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Verified: {tailor.verified ? 'Yes' : 'No'} · Accepting orders: {tailor.acceptingOrders ? 'Yes' : 'No'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            <Action label={tailor.verified ? 'Remove verification' : 'Verify tailor'} disabled={busy} onPress={() => confirm('Change verification?', `${tailor.verified ? 'Remove' : 'Grant'} verification for ${tailor.shopName}?`, () => adminService.updateTailorModeration(tailor.id, { verified: !tailor.verified }, accessToken!))} />
            <Action label={tailor.acceptingOrders ? 'Pause orders' : 'Allow orders'} disabled={busy} onPress={() => confirm('Change order availability?', `${tailor.acceptingOrders ? 'Stop' : 'Allow'} new customer requests for ${tailor.shopName}?`, () => adminService.updateTailorModeration(tailor.id, { acceptingOrders: !tailor.acceptingOrders }, accessToken!))} />
            <Action label="Delete profile" danger disabled={busy} onPress={() => confirm('Delete tailor profile?', `Delete ${tailor.shopName}? Existing related records can prevent deletion.`, () => adminService.deleteTailor(tailor.id, accessToken!))} />
        </View>
    </Panel>);

    const renderReviews = () => data.reviews.map((review) => <Panel key={review.id}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>Review #{review.id} · {review.rating}/5</Text>
        <Text style={{ color: C.text, fontSize: 12, marginTop: 4 }}>{review.customer?.email || 'Customer'} → {review.tailor?.shopName || 'Tailor'}</Text>
        {!!review.comment && <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>{review.comment}</Text>}
        <View style={{ marginTop: 10 }}><Action label="Remove review" danger disabled={busy} onPress={() => confirm('Remove review?', `Delete review #${review.id}?`, () => adminService.deleteReview(review.id, accessToken!))} /></View>
    </Panel>);

    const renderMeasurements = () => data.measurements.map((item) => <Panel key={item.id}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>Profile #{item.id} · {item.name}</Text>
        <Text style={{ color: C.text, fontSize: 12, marginTop: 4 }}>{item.user?.email || `User #${item.userId}`} · {nice(item.garmentType)} · {item.unit}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{Object.keys(item.measurements || {}).length} measurement value(s)</Text>
        <View style={{ marginTop: 10 }}><Action label="Delete profile" danger disabled={busy} onPress={() => confirm('Delete measurement profile?', `Delete ${item.name}?`, () => adminService.deleteMeasurement(item.id, accessToken!))} /></View>
    </Panel>);

    if (user?.role !== 'ADMIN') return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 24 }}><Text style={{ color: C.wine, fontWeight: '900', fontSize: 19 }}>Administrator access required</Text><Text style={{ color: C.muted, marginTop: 8 }}>This workspace is available only to accounts assigned the ADMIN role.</Text><Action label="Sign out" onPress={onSignOut} /></SafeAreaView>;

    return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingHorizontal: 17, paddingTop: 12, paddingBottom: 13, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}><Text style={{ color: C.wine, fontSize: 23, fontWeight: '900' }}>DarziHunar Admin</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>CONTROL CENTRE · {user.fullName || user.email}</Text></View>
                <Pressable onPress={onNotifications} style={{ padding: 9, marginRight: 5 }}><Text style={{ color: C.wine, fontSize: 22 }}>♧</Text></Pressable>
                <Pressable onPress={onSignOut} style={{ padding: 9 }}><Text style={{ color: '#A32D36', fontSize: 12, fontWeight: '900' }}>Sign out</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 13 }} contentContainerStyle={{ gap: 7 }}>
                {sections.map((item) => <Pressable key={item.key} onPress={() => setSection(item.key)} style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: section === item.key ? C.wine : C.cream, borderWidth: 1, borderColor: section === item.key ? C.wine : C.border }}><Text style={{ color: section === item.key ? '#FFFFFF' : C.wine, fontWeight: '800', fontSize: 11 }}>{item.label}</Text></Pressable>)}
            </ScrollView>
        </View>
        {loading ? <ActivityIndicator color={C.wine} style={{ marginTop: 40 }} /> : <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 34 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
            {!!error && <Panel><Text style={{ color: '#A32D36', fontSize: 12 }}>{error}</Text></Panel>}
            {section === 'overview' && renderOverview()}
            {section === 'users' && renderUsers()}
            {section === 'orders' && renderOrders()}
            {section === 'tailors' && renderTailors()}
            {section === 'reviews' && renderReviews()}
            {section === 'measurements' && renderMeasurements()}
            {section !== 'overview' && !(data[section] || []).length && <Panel><Text style={{ color: C.muted, fontSize: 12 }}>No {section} records found.</Text></Panel>}
            <Text style={{ color: C.muted, textAlign: 'center', fontSize: 10, marginTop: 5 }}>Pull down to refresh admin data. Actions are validated again by the backend.</Text>
        </ScrollView>}
    </SafeAreaView>;
}
