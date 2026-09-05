import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, asDataUri, type Memory } from "@/src/api";
import { getLittleUserId } from "@/src/little";
import { MoodStamp, RetryState, SectionHeading, useLittleStyles } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

export default function JournalScreen() {
  const styles = useLittleStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { setLoadError(false); setMemories(await api.getMemories(await getLittleUserId())); } catch (error) { setLoadError(true); console.warn("Journal load failed", error); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const filters = ["All", "Happy", "Loved", "Chill", "Core"];
  const visible = memories.filter((memory) => (filter === "All" || (filter === "Core" ? memory.is_core : memory.mood === filter)) && `${memory.caption} ${memory.song} ${memory.day_key} ${memory.mood}`.toLowerCase().includes(query.toLowerCase()));
  return <View style={[styles.root, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><View style={{ marginBottom: 18 }}><Text style={styles.overline}>Your archive</Text><Text style={styles.h1}>Little Moments <Text style={{ color: colors.brandPrimary }}>✦</Text></Text><Text style={[styles.body, { marginTop: 7 }]}>The ordinary is worth keeping.</Text></View><View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 17, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 14 }}><Ionicons name="search-outline" size={20} color={colors.muted} /><TextInput testID="journal-search" value={query} onChangeText={setQuery} placeholder="Search your little life" placeholderTextColor={colors.muted} style={{ flex: 1, minHeight: 50, paddingHorizontal: 10, color: colors.onSurface }} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 22 }}>{filters.map((item) => <Pressable testID={`journal-filter-${item.toLowerCase()}`} key={item} onPress={() => setFilter(item)} style={({ pressed }) => [{ minHeight: 40, paddingHorizontal: 15, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: filter === item ? colors.onSurface : colors.surfaceTertiary }, pressed && { opacity: 0.75 }]}><Text style={{ color: filter === item ? colors.onSurfaceInverse : colors.onSurfaceTertiary, fontSize: 13, fontWeight: "800" }}>{item}</Text></Pressable>)}</ScrollView><SectionHeading eyebrow={`${visible.length} saved`} title="Your story so far" action="Capture" onAction={() => router.push("/capture")} colors={colors} />{loading ? <View style={{ alignItems: "center", paddingVertical: 80 }}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.muted, { marginTop: 10 }]}>Turning pages...</Text></View> : loadError ? <RetryState message="Your little pages are taking a moment." onRetry={load} colors={colors} /> : visible.length === 0 ? <View style={[styles.card, { padding: 28, alignItems: "center", gap: 14, backgroundColor: colors.paper }]}><View style={{ width: 70, height: 70, borderRadius: 25, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] }}><Ionicons name="book-outline" size={34} color={colors.onSurface} /></View><Text style={[styles.h2, { textAlign: "center" }]}>Your story starts here.</Text><Text style={[styles.body, { textAlign: "center" }]}>A blank page is not a missed day. It is space for the next little thing.</Text><Pressable testID="journal-add-moment" onPress={() => router.push("/capture")} style={[styles.button, { backgroundColor: colors.brandPrimary, marginTop: 4 }]}><Ionicons name="camera-outline" size={19} color={colors.onBrandPrimary} /><Text style={[styles.buttonText, { color: colors.onBrandPrimary }]}>Add a moment</Text></Pressable></View> : <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>{visible.map((memory, index) => <MemoryTile key={memory.id} memory={memory} index={index} colors={colors} />)}</View>}</ScrollView></View>;
}

function MemoryTile({ memory, index, colors }: { memory: Memory; index: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const router = useRouter();
  const width = "48%" as const;
  return <Pressable onPress={() => router.push({ pathname: "/capture", params: { memoryId: memory.id } })} style={({ pressed }) => [{ width, marginTop: index % 3 === 1 ? 22 : 0 }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}><View style={{ backgroundColor: index % 2 ? colors.paper : colors.surfaceSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 8, transform: [{ rotate: index % 2 ? "1deg" : "-1deg" }] }}><Image source={{ uri: asDataUri(memory.image_base64) }} style={{ width: "100%", height: index % 3 === 0 ? 190 : 150, borderRadius: 14, backgroundColor: colors.surfaceTertiary }} resizeMode="cover" /><View style={{ paddingTop: 10, gap: 7 }}><Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "800" }}>{memory.day_key}</Text><MoodStamp mood={memory.mood} colors={colors} compact />{memory.caption ? <Text numberOfLines={2} style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 17 }}>{memory.caption}</Text> : null}</View></View></Pressable>;
}