import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Alert,
  Image,
} from "react-native";

const C = {
  bg: "#F8F3EC",
  card: "#FFFFFF",
  wine: "#633642",
  gold: "#C6A46A",
  cream: "#E9D9C7",
  text: "#34272A",
  muted: "#817174",
  border: "#E9DED5",
};

const categories = [
  { name: "Women", detail: "Sarees, suits, dresses & more" },
  { name: "Men", detail: "Shirts, kurtas, blazers" },
  { name: "Teenagers", detail: "Trendy custom styles" },
  { name: "Children", detail: "Frocks, outfits & more" },
];

const tailors = [
  { name: "Master Tailor One", rating: "4.8", distance: "Nearby" },
  { name: "Master Tailor Two", rating: "4.6", distance: "Nearby" },
];

const creations = [
  {
    name: "Embroidered Kurta Set",
    category: "Women",
    price: "From ₹1,200",
    image:
      "https://www.sharanya.net.in/cdn/shop/files/24_870e70ab-a58b-4df2-94b9-35a208ea4e4c.png?v=1747818550",
  },
  {
    name: "Designer Anarkali",
    category: "Women",
    price: "From ₹1,500",
    image:
      "https://amarsonsonline.com/cdn/shop/files/AE4A5338.jpg?v=1763558923&width=3840",
  },
  {
    name: "Kids Party Frock",
    category: "Children",
    price: "From ₹600",
    image:
      "https://stanwellskids.in/cdn/shop/products/doubleshade2.jpg?v=1705777744",
  },
  {
    name: "Men's Formal Blazer",
    category: "Men",
    price: "From ₹1,800",
    image:
      "https://360refinery.com/image/catalog/ghost-mannequin-photography/ghost-mannquin-photo-service-mens-jackets.jpg",
  },
  {
    name: "Embroidered Kurta",
    category: "Women",
    price: "From ₹1,100",
    image:
      "https://diademstore.com/cdn/shop/files/Black_Floral_Designed_Cotton_Kurta_Set_With_Pant_2.webp?v=1757055302",
  },
];

function BottomNavigation() {
  const tabs = [
    { label: "Home", symbol: "⌂" },
    { label: "Favorites", symbol: "♡" },
    { label: "My Orders", symbol: "▤" },
    { label: "Explore", symbol: "◇" },
    { label: "Measurements", symbol: "↔" },
  ];

  return (
    <View style={s.bottomArea}>
      <View style={s.bottomNav}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.label}
            style={s.bottomTab}
            onPress={() =>
              Alert.alert(tab.label, `${tab.label} screen will be added next.`)
            }
          >
            <Text style={[s.bottomSymbol, tab.label === "Home" && s.activeTab]}>
              {tab.symbol}
            </Text>

            <Text
              style={[s.bottomLabel, tab.label === "Home" && s.activeTab]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.footerTagline}>
        {" "}
        CRAFTED WITH CARE · STITCHED WITH LOVE
      </Text>
    </View>
  );
}

function AuthHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 30 }}
    >
      <Pressable onPress={onBack}>
        <Text style={{ fontSize: 30, color: C.wine }}>‹</Text>
      </Pressable>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: C.wine,
          marginLeft: 15,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function AuthInput({
  placeholder,
  secure = false,
}: {
  placeholder: string;
  secure?: boolean;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      secureTextEntry={secure}
      autoCapitalize="none"
      style={{
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        padding: 15,
        marginBottom: 14,
        color: C.text,
      }}
    />
  );
}

function AuthButton({
  title,
  onPress,
  outline = false,
}: {
  title: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: outline ? C.card : C.wine,
        borderWidth: outline ? 1 : 0,
        borderColor: C.wine,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
      }}
    >
      <Text style={{ color: outline ? C.wine : "#FFFFFF", fontWeight: "700" }}>
        {title}
      </Text>
    </Pressable>
  );
}

function AccountScreen({
  onBack,
  onLogin,
  onSignup,
}: {
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 24 }}>
        <AuthHeader title="My Account" onBack={onBack} />

        <View style={{ alignItems: "center", marginTop: 65 }}>
          <Text style={{ fontSize: 55 }}>👤</Text>
          <Text
            style={{
              fontSize: 25,
              fontWeight: "800",
              color: C.wine,
              marginTop: 20,
            }}
          >
            Welcome to DarziHunar
          </Text>
          <Text style={{ color: C.muted, textAlign: "center", marginTop: 10 }}>
            Login or create an account to get started.
          </Text>
        </View>

        <View style={{ marginTop: 50 }}>
          <AuthButton title="Login" onPress={onLogin} />
          <AuthButton title="Create Account" outline onPress={onSignup} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function LoginScreen({
  onBack,
  onSignup,
}: {
  onBack: () => void;
  onSignup: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AuthHeader title="Login" onBack={onBack} />

        <Text style={{ fontSize: 25, fontWeight: "800", color: C.wine }}>
          Welcome Back!
        </Text>
        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 25 }}>
          Login to continue with DarziHunar.
        </Text>

        <AuthInput placeholder="Email Address" />
        <AuthInput placeholder="Password" secure />

        <AuthButton
          title="Login"
          onPress={() =>
            Alert.alert("Login", "Backend connection will be added next.")
          }
        />

        <Pressable
          onPress={onSignup}
          style={{ marginTop: 25, alignItems: "center" }}
        >
          <Text style={{ color: C.wine }}>Don't have an account? Sign Up</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SignupRoleScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (role: "Customer" | "Tailor") => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 24 }}>
        <AuthHeader title="Create Account" onBack={onBack} />

        <Text style={{ fontSize: 24, fontWeight: "800", color: C.wine }}>
          Join DarziHunar
        </Text>
        <Text style={{ color: C.muted, marginTop: 8 }}>
          Choose how you want to use the app.
        </Text>

        <AuthButton
          title="I am a Customer"
          onPress={() => onSelect("Customer")}
        />
        <AuthButton
          title="I am a Tailor"
          outline
          onPress={() => onSelect("Tailor")}
        />
      </View>
    </SafeAreaView>
  );
}

function SignupScreen({
  role,
  onBack,
}: {
  role: "Customer" | "Tailor";
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AuthHeader title={`${role} Registration`} onBack={onBack} />

        <Text style={{ fontSize: 24, fontWeight: "800", color: C.wine }}>
          Create Your Account
        </Text>

        <View style={{ marginTop: 25 }}>
          <AuthInput placeholder="Full Name" />

          {role === "Tailor" && (
            <>
              <AuthInput placeholder="Shop / Business Name" />
              <AuthInput placeholder="Years of Experience" />
              <AuthInput placeholder="Specialization" />
            </>
          )}

          <AuthInput placeholder="Email Address" />
          <AuthInput placeholder="Mobile Number" />
          <AuthInput placeholder="Password" secure />
          <AuthInput placeholder="Confirm Password" secure />

          <AuthButton
            title="Create Account"
            onPress={() =>
              Alert.alert(
                "Registration",
                "Backend connection will be added next."
              )
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [showTopButton, setShowTopButton] = useState(false);

  // Account navigation
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "account" | "login" | "signup-role" | "signup"
  >("home");

  const [accountType, setAccountType] = useState<"Customer" | "Tailor">(
    "Customer"
  );

  // Screen navigation
  if (currentScreen === "account") {
    return (
      <AccountScreen
        onBack={() => setCurrentScreen("home")}
        onLogin={() => setCurrentScreen("login")}
        onSignup={() => setCurrentScreen("signup-role")}
      />
    );
  }

  if (currentScreen === "login") {
    return (
      <LoginScreen
        onBack={() => setCurrentScreen("account")}
        onSignup={() => setCurrentScreen("signup-role")}
      />
    );
  }

  if (currentScreen === "signup-role") {
    return (
      <SignupRoleScreen
        onBack={() => setCurrentScreen("account")}
        onSelect={(role) => {
          setAccountType(role);
          setCurrentScreen("signup");
        }}
      />
    );
  }

  if (currentScreen === "signup") {
    return (
      <SignupScreen
        role={accountType}
        onBack={() => setCurrentScreen("signup-role")}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        onScroll={(event) => {
          setShowTopButton(event.nativeEvent.contentOffset.y > 250);
        }}
        scrollEventThrottle={16}
      >
        {/* Brand header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>
              DarziHunar<Text style={s.dot}>.</Text>
            </Text>
            <Text style={s.tagline}>YOUR STYLE, PERFECTLY STITCHED</Text>
          </View>
          <Pressable
            style={s.bag}
            onPress={() => setCurrentScreen("account")}
            accessibilityLabel="Open Profile"
          >
            <Text style={s.bagIcon}>♙</Text>
          </Pressable>
        </View>

        {/* Location */}
        <Pressable
          style={s.location}
          onPress={() =>
            Alert.alert("Location", "Location selection will be added soon.")
          }
        >
          <Text style={s.pin}>⌖</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>YOUR LOCATION</Text>
            <Text style={s.locationText}>Choose your location ⌄</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>

        {/* Search */}
        <View style={s.search}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Search outfits, styles, tailors..."
            placeholderTextColor={C.muted}
            style={s.searchInput}
          />
        </View>

        {/* Fixed offers area - no carousel */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroEyebrow}>MADE FOR YOUR MOMENTS</Text>
            <Text style={s.heroDecoration}>✳</Text>
          </View>
          <Text style={s.heroTitle}>Every stitch tells your story.</Text>
          <Text style={s.heroBody}>
            Your design. Your measurements. Your perfect fit.
          </Text>
          <View style={s.offerPill}>
            <Text style={s.offerText}>Festive offers coming soon</Text>
          </View>
          <Text style={s.heroFlower}>✳</Text>
        </View>

        {/* Categories */}
        <View style={s.heading}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Choose Your Style</Text>
            <Text style={s.subtitle}>A perfect fit for every wardrobe</Text>
          </View>
        </View>

        <View style={s.grid}>
          {categories.map((item) => (
            <Pressable
              key={item.name}
              style={s.category}
              onPress={() =>
                Alert.alert(item.name, "Garment selection will open here.")
              }
            >
              <View style={s.categoryTitleRow}>
                <Text style={s.categoryName}>{item.name}</Text>
                <Text style={s.arrow}>↗</Text>
              </View>

              <Text style={s.categoryDetail}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        {/* AR and 360 */}
        <View style={s.heading}>
          <View>
            <Text style={s.title}>Preview Your Design</Text>
            <Text style={s.subtitle}>Explore our Features</Text>
          </View>
        </View>

        <View style={s.features}>
          <Pressable
            style={s.feature}
            onPress={() =>
              Alert.alert(
                "AR Preview",
                "AR preview integration is coming soon."
              )
            }
          >
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
              }}
              style={s.featureImage}
            />
            <Text style={s.featureName}>AR Preview</Text>
            <Text style={s.featureSub}>Visualise your style</Text>
          </Pressable>

          <Pressable
            style={s.feature}
            onPress={() =>
              Alert.alert("360° View", "360-degree viewing is coming soon.")
            }
          >
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500",
              }}
              style={s.featureImage}
            />
            <Text style={s.featureName}>360° View</Text>
            <Text style={s.featureSub}>Explore every angle</Text>
          </Pressable>
        </View>

        {/* Nearby tailors */}
        <View style={s.heading}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Tailor Masters Near You</Text>
            <Text style={s.subtitle}>Meet the hands behind the craft</Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert("All Tailors", "Tailor listing will open here.")
            }
          >
            <Text style={s.viewAll}>View all ↗</Text>
          </Pressable>
        </View>

        {tailors.map((tailor) => (
          <Pressable
            key={tailor.name}
            style={s.tailor}
            onPress={() =>
              Alert.alert(tailor.name, "Tailor profile will open here.")
            }
          >
            <View style={s.tailorIcon}>
              <Text style={{ fontSize: 26 }}>✂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tailorName}>{tailor.name}</Text>
              <Text style={s.rating}>
                ★ {tailor.rating} · {tailor.distance}
              </Text>
              <Text style={s.tailorNote}>
                Sample profile · Not a live listing
              </Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))}

        {/* Best creations - photo cards have no buttons */}
        <View style={s.heading}>
          <View>
            <Text style={s.title}>Best Creations</Text>
            <Text style={s.subtitle}>Inspiration, crafted with care</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {creations.map((item) => (
            <View key={item.name} style={s.creation}>
              <Pressable
                onPress={() =>
                  Alert.alert(item.name, `${item.category}\n${item.price}`)
                }
                accessibilityLabel={`View ${item.name} details`}
              >
                <Image
                  source={{ uri: item.image }}
                  style={s.creationImage}
                  resizeMode="cover"
                  onLoad={() => console.log("Image loaded:", item.name)}
                  onError={(error) =>
                    console.log(
                      "Image failed:",
                      item.name,
                      error.nativeEvent.error
                    )
                  }
                />
              </Pressable>

              <Text style={s.creationName}>{item.name}</Text>
              <Text style={s.creationHint}>
                {item.category} · {item.price}
              </Text>

              <Pressable
                style={s.detailsButton}
                onPress={() =>
                  Alert.alert(
                    item.name,
                    `Category: ${item.category}\n${item.price}\n\nFull design details and tailor selection will be added next.`
                  )
                }
              >
                <Text style={s.detailsButtonText}>Details →</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
      {/* Back to Top Button */}

      <Pressable
        style={s.chatButton}
        onPress={() =>
          Alert.alert("Chat Support", "How can we help you today?")
        }
        accessibilityLabel="Chat support"
      >
        <Text style={s.chatButtonText}>💬</Text>
      </Pressable>

      {showTopButton && (
        <Pressable
          style={s.topButton}
          onPress={() =>
            scrollRef.current?.scrollTo({
              y: 0,
              animated: true,
            })
          }
          accessibilityLabel="Back to top"
        >
          <Text style={s.topButtonText}>↑</Text>
        </Pressable>
      )}

      {/* Bottom Navigation + Tagline */}

      <BottomNavigation />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: { paddingHorizontal: 20, paddingBottom: 12 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 20,
  },
  logo: { fontSize: 27, fontWeight: "800", color: C.wine, letterSpacing: -1 },
  dot: { color: C.gold },
  tagline: { fontSize: 8, letterSpacing: 1.5, color: C.muted, marginTop: 5 },
  bag: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  bagIcon: { fontSize: 26, color: C.wine },

  location: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 13,
    marginBottom: 12,
  },
  pin: { fontSize: 24, color: C.wine, marginRight: 12 },
  eyebrow: { fontSize: 8, letterSpacing: 1.4, color: C.muted },
  locationText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  chevron: { color: C.wine, fontSize: 25, paddingHorizontal: 5 },

  search: {
    flexDirection: "row",
    alignItems: "center",
    height: 49,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 13,
    marginBottom: 19,
  },
  searchIcon: { color: C.wine, fontSize: 26, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 12, color: C.text },

  hero: {
    backgroundColor: C.wine,
    borderRadius: 22,
    padding: 20,
    minHeight: 185,
    marginBottom: 28,
    overflow: "hidden",
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between" },
  heroEyebrow: { color: C.cream, fontSize: 9, letterSpacing: 1.8 },
  heroDecoration: { color: C.gold, fontSize: 24 },
  heroTitle: {
    color: "#FFF8EF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 33,
    maxWidth: 280,
    marginTop: 13,
  },
  heroBody: { color: C.cream, fontSize: 11, marginTop: 8 },
  offerPill: {
    alignSelf: "flex-start",
    borderColor: C.gold,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  offerText: { color: "#FFF8EF", fontSize: 10 },
  heroFlower: {
    position: "absolute",
    right: 15,
    bottom: -35,
    fontSize: 115,
    color: "#80535D",
  },

  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 1,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: { color: C.muted, fontSize: 10, marginTop: 5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginBottom: 28 },

  category: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 82,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
  },

  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  categoryIcon: { fontSize: 28 },
  arrow: { fontSize: 17, color: C.gold },
  categoryName: { color: C.wine, fontSize: 15, fontWeight: "800" },
  categoryDetail: { color: C.muted, fontSize: 10, marginTop: 5 },

  features: { flexDirection: "row", gap: 12, marginBottom: 28 },
  feature: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    minHeight: 120,
  },
  featureImage: {
    width: "100%",
    height: 95,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: C.cream,
  },
  featureSymbol: { fontSize: 29, color: C.wine },
  featureName: { color: C.wine, fontSize: 14, fontWeight: "800", marginTop: 9 },
  featureSub: { color: C.muted, fontSize: 10, marginTop: 5 },
  viewAll: { color: C.wine, fontSize: 11, fontWeight: "700" },

  tailor: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 10,
  },
  tailorIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: C.cream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tailorName: { color: C.text, fontSize: 13, fontWeight: "800" },
  rating: { color: C.wine, fontSize: 11, marginTop: 5 },
  tailorNote: { color: C.muted, fontSize: 9, marginTop: 4 },

  creation: { width: 165, marginRight: 13, marginBottom: 15 },
  creationImage: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    backgroundColor: C.cream,
  },
  creationEmoji: { fontSize: 62 },
  imageMark: {
    position: "absolute",
    bottom: 12,
    color: C.wine,
    fontSize: 8,
    letterSpacing: 2,
  },
  creationName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 9,
  },
  creationHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  footer: {
    textAlign: "center",
    color: C.muted,
    fontSize: 9,
    marginTop: 4,
    paddingBottom: 0,
  },

  detailsButton: {
    backgroundColor: C.wine,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },

  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topButton: {
    position: "absolute",
    right: 16,
    bottom: 100,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.wine,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  topButtonText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },

  bottomArea: {
    backgroundColor: C.bg,
    borderTopWidth: 0,
    paddingTop: 4,
    paddingBottom: 2,
  },

  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },

  bottomSymbol: {
    fontSize: 20,
    color: C.muted,
    marginBottom: 3,
  },

  bottomLabel: {
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
  },

  activeTab: {
    color: C.wine,
    fontWeight: "700",
  },

  footerTagline: {
    textAlign: "center",
    color: C.muted,
    fontSize: 10,
    marginTop: 6,
  },

  chatButton: {
    position: "absolute",
    right: 16,
    bottom: 165,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.wine,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    zIndex: 10,
  },

  chatButtonText: {
    fontSize: 22,
  },
});
