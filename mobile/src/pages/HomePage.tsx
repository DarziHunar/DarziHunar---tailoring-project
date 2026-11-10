import React, { useRef, useState } from "react";
import {
  Alert, Image, Pressable, ScrollView, StatusBar, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavigation from "../components/BottomNavigation";
import { categories, creations, tailors } from "../data/homeData";
import { C } from "../theme/colors";
import { homeStyles as s } from "./home.styles";

type Props = { onProfile: () => void };

export default function HomePage({ onProfile }: Props) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [showTopButton, setShowTopButton] = useState(false);

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
            onPress={() => onProfile()}
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
