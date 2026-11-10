import React, { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import SignupPage from "../pages/SignupPage";
import SignupRolePage from "../pages/SignupRolePage";
import type { SignupRole } from "../pages/SignupRolePage";
import WelcomePage from "../pages/WelcomePage";
import { C } from "../theme/colors";

type PublicPage = "welcome" | "login" | "signup-role" | "signup" | "profile";

function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<PublicPage>("welcome");
  const [signupRole, setSignupRole] = useState<SignupRole>("CUSTOMER");

  useEffect(() => {
    setPage("welcome");
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.wine} />
        <Text style={{ color: C.muted, marginTop: 12 }}>Loading DarziHunar...</Text>
      </View>
    );
  }

  if (user) {
    if (page === "profile") return <ProfilePage onBack={() => setPage("welcome")} />;
    return <HomePage onProfile={() => setPage("profile")} />;
  }

  if (page === "login") {
    return <LoginPage onBack={() => setPage("welcome")} onSignup={() => setPage("signup-role")} />;
  }
  if (page === "signup-role") {
    return (
      <SignupRolePage
        onBack={() => setPage("welcome")}
        onSelect={(role) => {
          setSignupRole(role);
          setPage("signup");
        }}
      />
    );
  }
  if (page === "signup") {
    return (
      <SignupPage
        role={signupRole}
        onBack={() => setPage("signup-role")}
        onLogin={() => setPage("login")}
      />
    );
  }
  return <WelcomePage onLogin={() => setPage("login")} onSignup={() => setPage("signup-role")} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
