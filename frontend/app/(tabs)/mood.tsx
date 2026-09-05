import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
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
  const load = useCallback(async () => { setLoading(true); try { setLoadError(false); setMemories(await api.getMemories(await getLittleUserId())); } catch (error) { setLoadError(true); console.warn("Mood load failed", error); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const counts = useMemo(() => memories.reduce<Record<string, number>>((result, memory) => ({ ...result, [memory.mood]: (result[memory.mood] ?? 0) + 1 }), {}), [memories]);
  const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return <View style={[styles.root, { paddingTop: insets.top }]}><WebNav active="mood" colors={colors} /><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Text style={styles.overline}>A softer kind of stats</Text><Text style={styles.h1}>Your Vibe <Text style={{ color: colors.brandPrimary }}>✦</Text></Text><Text style={[styles.body, { marginTop: 7, marginBottom: 22 }]}>A colorful little record of how your days felt.</Text>{loading ? <View style={{ alignItems: "center", paddingVertical: 80 }}><ActivityIndicator color={colors.brandPrimary} /></View> : loadError ? <RetryState message="Your mood rainbow is taking a breather." onRetry={load} colors={colors} /> : memories.length < 1 ? <View style={[styles.card, { padding: 28, backgroundColor: colors.lavender, gap: 14 }]}><Ionicons name="sparkles-outline" size={34} color={colors.onSurface} /><Text style={styles.h2}>Tell us your vibe.</Text><Text style={styles.body}>Choose a mood when you capture a moment and we'll start building your rainbow.</Text></View> : <><View style={[styles.card, { backgroundColor: colors.paper, padding: 20, minHeight: 238, justifyContent: "space-between" }]}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}><View><Text style={styles.overline}>Your month in colors</Text><Text style={[styles.h2, { marginTop: 7 }]}>{topMood ? `Mostly ${topMood[0].toLowerCase()}.` : "Still unfolding."}</Text></View><View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" }}><Ionicons name="sunny-outline" size={25} color={colors.onSurface} /></View></View><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 }}>{memories.slice(0, 28).map((memory) => <View key={memory.id} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors[getMood(memory.mood).color] }} accessibilityLabel={memory.mood} />)}</View><Text style={[styles.muted, { marginTop: 16 }]}>{memories.length} {memories.length === 1 ? "day" : "days"} captured · no right way to feel</Text></View><View style={{ marginTop: 30 }}><SectionHeading eyebrow="The little pattern" title="Your mood mix" colors={colors} /><View style={[styles.card, { padding: 18, gap: 15 }]}>{Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => <MoodBar key={mood} mood={mood} count={count} total={memories.length} colors={colors} />)}</View></View><View style={{ marginTop: 30 }}><SectionHeading eyebrow="A gentle note" title="What this says" colors={colors} /><View style={{ backgroundColor: colors.sky, borderRadius: 22, padding: 20, gap: 10 }}><Ionicons name="heart-outline" size={25} color={colors.onSurface} /><Text style={{ color: colors.onSurface, fontSize: 18, lineHeight: 25, fontWeight: "800" }}>{topMood ? `You made space for ${topMood[0].toLowerCase()} moments this month.` : "Your story is still unfolding."}</Text><Text style={styles.body}>Just an observation, never a verdict. Your mood belongs to you.</Text></View></View></>}</ScrollView></View>;
}

function MoodBar({ mood, count, total, colors }: { mood: string; count: number; total: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const config = getMood(mood);
  return <View style={{ gap: 8 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><MoodStamp mood={mood} colors={colors} compact /><Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>{count} {count === 1 ? "day" : "days"}</Text></View><View style={{ height: 9, borderRadius: 999, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}><View style={{ height: "100%", width: `${Math.max(12, (count / total) * 100)}%`, borderRadius: 999, backgroundColor: colors[config.color] }} /></View></View>;
}