import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { makeStyles } from "@/src/theme";
import { getMood, MOODS } from "@/src/little";
import type { ThemeColors } from "@/src/theme";

export const useLittleStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 28 : 16, paddingBottom: 36 },
  overline: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  h1: { color: colors.onSurface, fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1 },
  h2: { color: colors.onSurface, fontSize: 22, lineHeight: 28, fontWeight: "800", letterSpacing: -0.4 },
  body: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  button: { minHeight: 50, borderRadius: 18, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { fontSize: 15, fontWeight: "800" },
}));

type WebTab = "today" | "capture" | "journal" | "mood" | "me";
const webTabs: { key: WebTab; label: string; icon: "home-outline" | "camera-outline" | "book-outline" | "sparkles-outline" | "person-outline"; route: string }[] = [
  { key: "today", label: "Today", icon: "home-outline", route: "/(tabs)" },
  { key: "capture", label: "Capture", icon: "camera-outline", route: "/(tabs)/capture" },
  { key: "journal", label: "Journal", icon: "book-outline", route: "/(tabs)/journal" },
  { key: "mood", label: "Mood", icon: "sparkles-outline", route: "/(tabs)/mood" },
  { key: "me", label: "Me", icon: "person-outline", route: "/(tabs)/me" },
];

export function WebNav({ active, colors }: { active: WebTab; colors: ThemeColors }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web") return null;
  const compact = width < 820;
  const tabs = webTabs.map((tab) => <Pressable testID={`web-tab-${tab.key}`} key={tab.key} onPress={() => router.push(tab.route as never)} style={({ pressed }) => [{ minHeight: 44, borderRadius: 14, paddingHorizontal: compact ? 12 : 13, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: active === tab.key ? colors.brandTertiary : "transparent" }, pressed && { opacity: 0.7 }]}><Ionicons name={tab.icon} size={17} color={active === tab.key ? colors.onBrandTertiary : colors.muted} /><Text style={{ color: active === tab.key ? colors.onBrandTertiary : colors.onSurfaceSecondary, fontSize: 13, fontWeight: "800" }}>{tab.label}</Text></Pressable>);
  const brand = <Pressable testID="web-brand" onPress={() => router.replace("/(tabs)")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] }}><Ionicons name="sparkles" size={20} color={colors.onBrandPrimary} /></View><View><Text style={{ color: colors.onSurface, fontSize: 19, fontWeight: "900", letterSpacing: 2 }}>LITTLE</Text><Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 }}>one little moment</Text></View></Pressable>;
  const capture = <Pressable testID="web-capture-cta" onPress={() => router.push("/(tabs)/capture" as never)} style={({ pressed }) => [{ minHeight: 44, borderRadius: 999, paddingHorizontal: compact ? 12 : 16, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.onSurface }, pressed && { opacity: 0.8 }]}><Ionicons name="camera-outline" size={17} color={colors.onSurfaceInverse} />{compact ? null : <Text style={{ color: colors.onSurfaceInverse, fontSize: 13, fontWeight: "800" }}>Capture</Text>}</Pressable>;
  return <View style={{ borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surface }}><View style={{ width: "100%", maxWidth: 1160, alignSelf: "center", paddingHorizontal: compact ? 16 : 28 }}>{compact ? <><View style={{ minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>{brand}{capture}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingBottom: 10 }}>{tabs}</ScrollView></> : <View style={{ minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 22 }}>{brand}<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>{tabs}</View>{capture}</View>}</View></View>;
}

export function MoodSelector({ selected, onSelect, colors }: { selected: string; onSelect: (mood: string) => void; colors: ThemeColors }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "800" }}>How did it feel?</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {MOODS.map((mood) => {
          const active = selected === mood.name;
          const fill = colors[mood.color];
          return (
            <Pressable testID={`mood-${mood.name.toLowerCase()}`} key={mood.name} onPress={() => onSelect(mood.name)} accessibilityRole="button" accessibilityLabel={`${mood.name} mood`} style={({ pressed }) => [{ minHeight: 44, borderRadius: 999, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? fill : colors.surfaceTertiary, borderWidth: active ? 2 : 1, borderColor: active ? colors.brandPrimary : colors.border }, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}>
              <Ionicons name={mood.icon} size={17} color={active ? colors.onSurface : colors.onSurfaceTertiary} />
              <Text style={{ color: active ? colors.onSurface : colors.onSurfaceTertiary, fontSize: 13, fontWeight: active ? "800" : "600" }}>{mood.name}</Text>
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
  return <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: compact ? 9 : 12, paddingVertical: compact ? 6 : 8, borderRadius: 999, backgroundColor: fill }}><Ionicons name={config.icon} size={compact ? 14 : 17} color={colors.onSurface} /><Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: compact ? 12 : 13 }}>{mood}</Text></View>;
}

export function SectionHeading({ eyebrow, title, action, onAction, colors }: { eyebrow?: string; title: string; action?: string; onAction?: () => void; colors: ThemeColors }) {
  return <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}><View style={{ gap: 4 }}>{eyebrow ? <Text style={{ color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>{eyebrow}</Text> : null}<Text style={{ color: colors.onSurface, fontSize: 21, fontWeight: "800" }}>{title}</Text></View>{action && onAction ? <Pressable onPress={onAction} hitSlop={8}><Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: "800" }}>{action}</Text></Pressable> : null}</View>;
}

export function RetryState({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: ThemeColors }) {
  return <View style={{ alignItems: "center", paddingVertical: 34, gap: 10 }}><Ionicons name="cloud-offline-outline" size={28} color={colors.muted} /><Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, textAlign: "center" }}>{message}</Text><Pressable testID="retry-button" onPress={onRetry} style={{ minHeight: 44, paddingHorizontal: 17, borderRadius: 999, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.onBrandTertiary, fontWeight: "800" }}>Try again</Text></Pressable></View>;
}