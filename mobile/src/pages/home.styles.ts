import { StyleSheet } from "react-native";
import { C } from "../theme/colors";

export const homeStyles = StyleSheet.create({
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
