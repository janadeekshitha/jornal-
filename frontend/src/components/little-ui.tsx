import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { makeStyles } from "@/src/theme";
import { getMood, MOODS } from "@/src/little";
import type { ThemeColors } from "@/src/theme";

export const useLittleStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  overline: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  h1: { color: colors.onSurface, fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1 },
  h2: { color: colors.onSurface, fontSize: 22, lineHeight: 28, fontWeight: "800", letterSpacing: -0.4 },
  body: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  button: { minHeight: 50, borderRadius: 18, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { fontSize: 15, fontWeight: "800" },
}));

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