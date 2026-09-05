import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type Memory } from "@/src/api";
import { getLittleUserId, getMood } from "@/src/little";
import { MoodStamp, RetryState, SectionHeading, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

export default function MoodScreen() {
  const styles = useLittleStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLoadError(false);
      setMemories(await api.getMemories(await getLittleUserId()));
    } catch (error) {
      setLoadError(true);
      console.warn("Mood load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const counts = useMemo(
    () => memories.reduce<Record<string, number>>((result, memory) => ({ ...result, [memory.mood]: (result[memory.mood] ?? 0) + 1 }), {}),
    [memories],
  );
  const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WebNav active="mood" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>A softer kind of stats</Text>
        <Text style={styles.h1}>Your Vibe <Text style={{ color: colors.brand }}>✦</Text></Text>
        <Text style={[styles.body, { marginTop: 7, marginBottom: 22 }]}>A colorful little record of how your days felt.</Text>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : loadError ? (
          <RetryState message="Your mood rainbow is taking a breather." onRetry={load} colors={colors} />
        ) : memories.length < 1 ? (
          <View style={[styles.card, { padding: 28, backgroundColor: colors.lavender, gap: 14, borderColor: colors.onSurface, borderWidth: 2 }]}>
            <Ionicons name="sparkles" size={34} color={colors.onSurface} />
            <Text style={styles.h2}>Tell us your vibe.</Text>
            <Text style={styles.body}>Choose a mood when you capture a moment and we{"\u2019"}ll start building your rainbow.</Text>
          </View>
        ) : (
          <>
            {/* Mood mosaic card */}
            <View style={[styles.card, { backgroundColor: colors.paper, padding: 22, minHeight: 260, justifyContent: "space-between", borderColor: colors.onSurface, borderWidth: 2 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.overline}>Your month in colors</Text>
                  <Text style={[styles.h2, { marginTop: 8, fontSize: 26, letterSpacing: -0.6 }]}>{topMood ? `Mostly ${topMood[0].toLowerCase()}.` : "Still unfolding."}</Text>
                </View>
                <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: colors.sunny, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.onSurface, transform: [{ rotate: "-8deg" }] }}>
                  <Ionicons name="sunny" size={28} color={colors.onSurface} />
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
                {memories.slice(0, 35).map((memory) => (
                  <View
                    key={memory.id}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors[getMood(memory.mood).color], borderWidth: 1.5, borderColor: colors.onSurface }}
                    accessibilityLabel={memory.mood}
                  />
                ))}
              </View>
              <Text style={[styles.muted, { marginTop: 16, fontWeight: "700" }]}>{memories.length} {memories.length === 1 ? "day" : "days"} captured · no right way to feel</Text>
            </View>

            {/* Mood mix */}
            <View style={{ marginTop: 30 }}>
              <SectionHeading eyebrow="The little pattern" title="Your mood mix" colors={colors} />
              <View style={[styles.card, { padding: 20, gap: 16, backgroundColor: colors.surface, borderColor: colors.onSurface, borderWidth: 2 }]}>
                {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
                  <MoodBar key={mood} mood={mood} count={count} total={memories.length} colors={colors} />
                ))}
              </View>
            </View>

            {/* Gentle note */}
            <View style={{ marginTop: 30 }}>
              <SectionHeading eyebrow="A gentle note" title="What this says" colors={colors} />
              <View style={{ backgroundColor: colors.sky, borderRadius: 24, padding: 22, gap: 10, borderWidth: 2, borderColor: colors.onSurface }}>
                <Ionicons name="heart" size={26} color={colors.onSurface} />
                <Text style={{ color: colors.onSurface, fontSize: 19, lineHeight: 26, fontWeight: "900", letterSpacing: -0.3 }}>{topMood ? `You made space for ${topMood[0].toLowerCase()} moments this month.` : "Your story is still unfolding."}</Text>
                <Text style={[styles.body, { fontWeight: "600" }]}>Just an observation, never a verdict. Your mood belongs to you.</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MoodBar({ mood, count, total, colors }: { mood: string; count: number; total: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const config = getMood(mood);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <MoodStamp mood={mood} colors={colors} compact />
        <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "900" }}>{count} {count === 1 ? "day" : "days"}</Text>
      </View>
      <View style={{ height: 12, borderRadius: 999, backgroundColor: colors.surface, overflow: "hidden", borderWidth: 1.5, borderColor: colors.onSurface }}>
        <View style={{ height: "100%", width: `${Math.max(12, (count / total) * 100)}%`, borderRadius: 999, backgroundColor: colors[config.color] }} />
      </View>
    </View>
  );
}
