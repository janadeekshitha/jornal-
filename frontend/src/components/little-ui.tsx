import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { makeStyles } from "@/src/theme";
import { getMood, MOODS } from "@/src/little";
import type { ThemeColors } from "@/src/theme";

export const useLittleStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 24 : 12, paddingBottom: 44 },
  overline: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.8, textTransform: "uppercase" },
  h1: { color: colors.onSurface, fontSize: 36, lineHeight: 40, fontWeight: "900", letterSpacing: -1.4 },
  h2: { color: colors.onSurface, fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.4 },
  body: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  button: { minHeight: 52, borderRadius: 20, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.2 },
}));

type WebTab = "today" | "capture" | "journal" | "mood" | "me";
const webTabs: { key: WebTab; label: string; icon: "home" | "camera" | "book" | "sparkles" | "person"; route: string }[] = [
  { key: "today", label: "Today", icon: "home", route: "/(tabs)" },
  { key: "capture", label: "Capture", icon: "camera", route: "/(tabs)/capture" },
  { key: "journal", label: "Journal", icon: "book", route: "/(tabs)/journal" },
  { key: "mood", label: "Mood", icon: "sparkles", route: "/(tabs)/mood" },
  { key: "me", label: "Me", icon: "person", route: "/(tabs)/me" },
];

export function WebNav({ active, colors }: { active: WebTab; colors: ThemeColors }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web") return null;
  const compact = width < 820;
  const tabs = webTabs.map((tab) => {
    const isActive = active === tab.key;
    return (
      <Pressable
        testID={`web-tab-${tab.key}`}
        key={tab.key}
        onPress={() => router.push(tab.route as never)}
        style={({ pressed }) => [
          { minHeight: 44, borderRadius: 999, paddingHorizontal: compact ? 14 : 16, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: isActive ? colors.onSurface : "transparent" },
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Ionicons name={`${tab.icon}${isActive ? "" : "-outline"}` as never} size={17} color={isActive ? colors.onSurfaceInverse : colors.onSurfaceSecondary} />
        <Text style={{ color: isActive ? colors.onSurfaceInverse : colors.onSurfaceSecondary, fontSize: 13, fontWeight: "900" }}>{tab.label}</Text>
      </Pressable>
    );
  });
  const brand = (
    <Pressable testID="web-brand" onPress={() => router.replace("/(tabs)")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], shadowColor: colors.brandPrimary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
        <Ionicons name="sparkles" size={22} color={colors.onBrandPrimary} />
      </View>
      <View>
        <Text style={{ color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: 3 }}>LITTLE</Text>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>one · little · moment</Text>
      </View>
    </Pressable>
  );
  const capture = (
    <Pressable
      testID="web-capture-cta"
      onPress={() => router.push("/(tabs)/capture" as never)}
      style={({ pressed }) => [
        { minHeight: 46, borderRadius: 999, paddingHorizontal: compact ? 14 : 18, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.brand, shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Ionicons name="camera" size={18} color={colors.onBrand} />
      {compact ? null : <Text style={{ color: colors.onBrand, fontSize: 13, fontWeight: "900", letterSpacing: 0.4 }}>Capture</Text>}
    </Pressable>
  );
  return (
    <View style={{ position: "relative", overflow: "hidden", borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surface }}>
      <View pointerEvents="none" style={{ position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: colors.hotPink, opacity: 0.18, top: -80, left: "32%" }} />
      <View pointerEvents="none" style={{ position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: colors.aqua, opacity: 0.28, bottom: -66, right: "15%" }} />
      <View pointerEvents="none" style={{ position: "absolute", width: 60, height: 60, borderRadius: 18, backgroundColor: colors.lime, opacity: 0.5, top: 8, right: 8, transform: [{ rotate: "22deg" }] }} />
      <View pointerEvents="none" style={{ position: "absolute", width: 26, height: 26, borderRadius: 13, backgroundColor: colors.grape, opacity: 0.55, bottom: 14, left: 24 }} />
      <View style={{ width: "100%", maxWidth: 1160, alignSelf: "center", paddingHorizontal: compact ? 16 : 28, zIndex: 1 }}>
        {compact ? (
          <>
            <View style={{ minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {brand}
              {capture}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
              {tabs}
            </ScrollView>
          </>
        ) : (
          <View style={{ minHeight: 82, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 22 }}>
            {brand}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{tabs}</View>
            {capture}
          </View>
        )}
      </View>
    </View>
  );
}

export function MoodSelector({ selected, onSelect, colors }: { selected: string; onSelect: (mood: string) => void; colors: ThemeColors }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: "900" }}>How did it feel? <Text style={{ color: colors.brand }}>✦</Text></Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {MOODS.map((mood) => {
          const active = selected === mood.name;
          const fill = colors[mood.color];
          return (
            <Pressable
              testID={`mood-${mood.name.toLowerCase()}`}
              key={mood.name}
              onPress={() => onSelect(mood.name)}
              accessibilityRole="button"
              accessibilityLabel={`${mood.name} mood`}
              style={({ pressed }) => [
                { minHeight: 46, borderRadius: 999, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? fill : colors.surface, borderWidth: active ? 2 : 1.5, borderColor: active ? colors.onSurface : colors.border, shadowColor: active ? colors.onSurface : "transparent", shadowOpacity: active ? 0.18 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons name={mood.icon} size={17} color={colors.onSurface} />
              <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: active ? "900" : "700" }}>{mood.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MoodStamp({ mood, colors, compact = false }: { mood: string; colors: ThemeColors; compact?: boolean }) {
  const config = getMood(mood);
  const fill = colors[config.color];
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: compact ? 10 : 13, paddingVertical: compact ? 6 : 8, borderRadius: 999, backgroundColor: fill, borderWidth: 1.5, borderColor: colors.onSurface }}>
      <Ionicons name={config.icon} size={compact ? 14 : 17} color={colors.onSurface} />
      <Text style={{ color: colors.onSurface, fontWeight: "900", fontSize: compact ? 12 : 13 }}>{mood}</Text>
    </View>
  );
}

export function SectionHeading({ eyebrow, title, action, onAction, colors }: { eyebrow?: string; title: string; action?: string; onAction?: () => void; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
      <View style={{ gap: 4 }}>
        {eyebrow ? <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" }}>{eyebrow}</Text> : null}
        <Text style={{ color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 }}>{title}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 7 }}>
        {action && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={{ color: colors.brand, fontSize: 13, fontWeight: "900" }}>{action}</Text>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: "row", gap: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.hotPink }} />
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.sunny }} />
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.aqua }} />
        </View>
      </View>
    </View>
  );
}

export function ColorRibbon({ colors }: { colors: ThemeColors }) {
  const swatches = [colors.hotPink, colors.tangerine, colors.sunny, colors.lime, colors.aqua, colors.grape, colors.lavender];
  return (
    <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
      {swatches.map((swatch, index) => (
        <View key={`${swatch}-${index}`} style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: swatch }} />
      ))}
    </View>
  );
}

export function StickerRow({ colors }: { colors: ThemeColors }) {
  const stickers: { icon: "sparkles" | "heart" | "flower" | "sunny" | "moon"; bg: string }[] = [
    { icon: "sparkles", bg: colors.sunny },
    { icon: "heart", bg: colors.hotPink },
    { icon: "flower", bg: colors.lavender },
    { icon: "sunny", bg: colors.tangerine },
    { icon: "moon", bg: colors.grape },
  ];
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {stickers.map((sticker, index) => (
        <View
          key={sticker.icon}
          style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: sticker.bg, alignItems: "center", justifyContent: "center", transform: [{ rotate: `${(index % 2 === 0 ? -1 : 1) * (6 + index)}deg` }], borderWidth: 1.5, borderColor: colors.onSurface }}
        >
          <Ionicons name={sticker.icon} size={17} color={colors.onSurface} />
        </View>
      ))}
    </View>
  );
}

export function RetryState({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: ThemeColors }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 34, gap: 10 }}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.muted} />
      <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, textAlign: "center" }}>{message}</Text>
      <Pressable testID="retry-button" onPress={onRetry} style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.onBrand, fontWeight: "900" }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function ConfettiCorner({ colors }: { colors: ThemeColors }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: -10, right: -10, width: 90, height: 90 }}>
      <LinearGradient
        colors={[colors.hotPink, colors.sunny]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", width: 46, height: 46, borderRadius: 16, top: 12, right: 12, transform: [{ rotate: "18deg" }], opacity: 0.9 }}
      />
      <View style={{ position: "absolute", width: 18, height: 18, borderRadius: 4, backgroundColor: colors.aqua, top: 44, right: 52, transform: [{ rotate: "-14deg" }] }} />
      <View style={{ position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: colors.lime, top: 8, right: 62 }} />
    </View>
  );
}
