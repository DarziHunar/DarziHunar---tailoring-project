import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { categories, creations } from '../data/homeData';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import SignupPage from '../pages/SignupPage';
import SignupRolePage from '../pages/SignupRolePage';
import type { SignupRole } from '../pages/SignupRolePage';
import WelcomePage from '../pages/WelcomePage';
import { FavoritesPage, MeasurementsPage, OrdersPage, ExplorePage, SearchPage, LocationPage, CreationDetailPage } from '../pages/ExplorePages';
import { BackendAllTailorsPage, BackendCategoriesPage, BackendTailorDetailPage, BackendTailorsPage } from '../pages/BackendBrowsePages';
import TailorDashboardPage from '../pages/TailorDashboardPage';
import TailorBusinessProfilePage from '../pages/TailorBusinessProfilePage';
import TailorOrdersPage from '../pages/TailorOrdersPage';
import type { MainTab } from '../types/navigation';
import type { TailorProfile } from '../services/tailorService';
import { CustomerStylesPage, CustomerTailorsPage, CustomerTailorDetailPage, CustomerOrderDetailsPage } from '../pages/CustomerOrderPages';
import type { Audience, GarmentStyle } from '../services/stylesService';
import { C } from '../theme/colors';

type PublicPage = 'welcome' | 'login' | 'signup-role' | 'signup';
type Category = (typeof categories)[number];
type Creation = (typeof creations)[number];
type AppRoute =
  | { name: 'home' }
  | { name: 'tailor-home' }
  | { name: 'profile' }
  | { name: 'tailor-business' }
  | { name: 'tailor-orders' }
  | { name: 'category'; category: Category }
  | { name: 'category-tailors'; category: string }
  | { name: 'customer-styles'; audience: Audience }
  | { name: 'customer-tailors'; audience: Audience; style: GarmentStyle }
  | { name: 'customer-tailor-detail'; audience: Audience; style: GarmentStyle; tailor: TailorProfile }
  | { name: 'customer-order-details'; audience: Audience; style: GarmentStyle; tailor: TailorProfile }
  | { name: 'tailors' }
  | { name: 'tailor-detail'; tailor: TailorProfile }
  | { name: 'creation'; creation: Creation }
  | { name: 'favorites' }
  | { name: 'orders' }
  | { name: 'explore' }
  | { name: 'measurements' }
  | { name: 'search'; query: string }
  | { name: 'location' };

function AppNavigator() {
  const { user, isLoading, signOut } = useAuth();
  const [publicPage, setPublicPage] = useState<PublicPage>('welcome');
  const [signupRole, setSignupRole] = useState<SignupRole>('CUSTOMER');
  const [routes, setRoutes] = useState<AppRoute[]>([{ name: 'home' }]);
  const [locationLabel, setLocationLabel] = useState('');
  const route = routes[routes.length - 1] ?? { name: 'home' as const };

  useEffect(() => {
    if (user) {
      setRoutes([{ name: user.role === 'TAILOR' ? 'tailor-home' : 'home' }]);
    } else {
      setPublicPage('welcome');
      setRoutes([{ name: 'home' }]);
    }
  }, [user?.id, user?.role]);

  const push = (next: AppRoute) => setRoutes((current) => [...current, next]);
  const goBack = () => setRoutes((current) => current.length > 1 ? current.slice(0, -1) : current);
  const goRoot = () => setRoutes([{ name: user?.role === 'TAILOR' ? 'tailor-home' : 'home' }]);

  const navigateTab = (tab: MainTab) => {
    const nextRoutes: Record<MainTab, AppRoute> = {
      home: { name: 'home' },
      favorites: { name: 'favorites' },
      orders: { name: 'orders' },
      explore: { name: 'explore' },
      measurements: { name: 'measurements' },
    };
    push(nextRoutes[tab]);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!user) {
        if (publicPage === 'signup') setPublicPage('signup-role');
        else if (publicPage === 'signup-role' || publicPage === 'login') setPublicPage('welcome');
        else return false;
        return true;
      }
      if (routes.length > 1) {
        setRoutes((current) => current.slice(0, -1));
        return true;
      }
      // At the root page, retain normal Android behaviour (the app may exit).
      return false;
    });
    return () => subscription.remove();
  }, [user, publicPage, routes.length]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" />
      <ActivityIndicator size="large" color={C.wine} />
      <Text style={{ color: C.muted, marginTop: 12 }}>Loading DarziHunar...</Text>
    </View>;
  }

  if (!user) {
    if (publicPage === 'login') return <LoginPage onBack={() => setPublicPage('welcome')} onSignup={() => setPublicPage('signup-role')} />;
    if (publicPage === 'signup-role') return <SignupRolePage onBack={() => setPublicPage('welcome')} onSelect={(role) => { setSignupRole(role); setPublicPage('signup'); }} />;
    if (publicPage === 'signup') return <SignupPage role={signupRole} onBack={() => setPublicPage('signup-role')} onLogin={() => setPublicPage('login')} />;
    return <WelcomePage onLogin={() => setPublicPage('login')} onSignup={() => setPublicPage('signup-role')} />;
  }

  if (route.name === 'tailor-home') {
    return <TailorDashboardPage onProfile={() => push({ name: 'profile' })} onBusinessProfile={() => push({ name: 'tailor-business' })} onOrders={() => push({ name: 'tailor-orders' })} onSignOut={() => { void signOut(); }} />;
  }
  if (route.name === 'tailor-business') return <TailorBusinessProfilePage onBack={goBack} onSaved={goBack} />;
  if (route.name === 'tailor-orders') return <TailorOrdersPage onBack={goBack} />;
  if (route.name === 'profile') return <ProfilePage onBack={goBack} onEditBusiness={() => push({ name: 'tailor-business' })} />;

  if (route.name === 'home') return <HomePage
    onProfile={() => push({ name: 'profile' })}
    onOpenCategory={(category) => push({ name: 'customer-styles', audience: category.name.toUpperCase() as Audience })}
    onViewAllTailors={() => push({ name: 'tailors' })}
    onOpenTailor={(tailor) => push({ name: 'tailor-detail', tailor })}
    onOpenCreation={(creation) => push({ name: 'creation', creation })}
    onNavigateTab={navigateTab}
    onSearch={(query) => push({ name: 'search', query })}
    onLocation={() => push({ name: 'location' })}
    locationLabel={locationLabel}
  />;
  if (route.name === 'customer-styles') return <CustomerStylesPage audience={route.audience} onBack={goBack} onNavigate={navigateTab} onSelect={(style) => push({ name: 'customer-tailors', audience: route.audience, style })} />;
  if (route.name === 'customer-tailors') return <CustomerTailorsPage audience={route.audience} style={route.style} onBack={goBack} onNavigate={navigateTab} onSelect={(tailor) => push({ name: 'customer-tailor-detail', audience: route.audience, style: route.style, tailor })} />;
  if (route.name === 'customer-tailor-detail') return <CustomerTailorDetailPage audience={route.audience} style={route.style} tailor={route.tailor} onBack={goBack} onNavigate={navigateTab} onContinue={() => push({ name: 'customer-order-details', audience: route.audience, style: route.style, tailor: route.tailor })} />;
  if (route.name === 'customer-order-details') return <CustomerOrderDetailsPage audience={route.audience} style={route.style} tailor={route.tailor} onBack={goBack} onNavigate={navigateTab} onOrderPlaced={() => push({ name: 'orders' })} />;
  if (route.name === 'category') return <BackendCategoriesPage styleCategory={route.category} onBack={goBack} onSelect={(category) => push({ name: 'category-tailors', category })} onNavigate={navigateTab} />;
  if (route.name === 'category-tailors') return <BackendTailorsPage category={route.category} onBack={goBack} onSelect={(tailor) => push({ name: 'tailor-detail', tailor })} onNavigate={navigateTab} />;
  if (route.name === 'tailors') return <BackendAllTailorsPage onBack={goBack} onSelect={(tailor) => push({ name: 'tailor-detail', tailor })} onNavigate={navigateTab} />;
  if (route.name === 'tailor-detail') return <BackendTailorDetailPage tailor={route.tailor} onBack={goBack} onNavigate={navigateTab} />;
  if (route.name === 'creation') return <CreationDetailPage creation={route.creation} onBack={goBack} onFindTailor={() => push({ name: 'tailors' })} onNavigate={navigateTab} />;
  if (route.name === 'favorites') return <FavoritesPage onBack={goBack} onNavigate={navigateTab} />;
  if (route.name === 'orders') return <OrdersPage onBack={goBack} onNavigate={navigateTab} />;
  if (route.name === 'measurements') return <MeasurementsPage onBack={goBack} onNavigate={navigateTab} />;
  if (route.name === 'location') return <LocationPage onBack={goBack} onNavigate={navigateTab} onSave={(location) => { setLocationLabel(location); goBack(); }} />;
  if (route.name === 'search') return <SearchPage
    initialQuery={route.query}
    categories={categories}
    tailors={[]}
    onBack={goBack}
    onOpenCategory={(category) => push({ name: 'customer-styles', audience: category.name.toUpperCase() as Audience })}
    onSelectTailor={(tailor: any) => push({ name: 'tailor-detail', tailor })}
    onNavigate={navigateTab}
  />;
  return <ExplorePage
    categories={categories}
    tailors={[]}
    onBack={goBack}
    onOpenCategory={(category) => push({ name: 'customer-styles', audience: category.name.toUpperCase() as Audience })}
    onViewAllTailors={() => push({ name: 'tailors' })}
    onSelectTailor={(tailor: any) => push({ name: 'tailor-detail', tailor })}
    onNavigate={navigateTab}
  />;
}

export default function App() {
  return <SafeAreaProvider><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider>;
}
