import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, asDataUri, type Memory } from "@/src/api";
import { getLittleUserId } from "@/src/little";
import { MoodStamp, RetryState, SectionHeading, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

const FILTERS = ["All", "Happy", "Loved", "Chill", "Excited", "Peaceful", "Grateful", "Core"];

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLoadError(false);
      setMemories(await api.getMemories(await getLittleUserId()));
    } catch (error) {
      setLoadError(true);
      console.warn("Journal load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = memories.filter((memory) =>
    (filter === "All" || (filter === "Core" ? memory.is_core : memory.mood === filter)) &&
    `${memory.caption} ${memory.song} ${memory.day_key} ${memory.mood}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WebNav active="journal" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.overline}>Your archive</Text>
          <Text style={styles.h1}>Little Moments <Text style={{ color: colors.brand }}>✦</Text></Text>
          <Text style={[styles.body, { marginTop: 7 }]}>The ordinary is worth keeping.</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.onSurface, paddingHorizontal: 14, marginBottom: 14 }}>
          <Ionicons name="search" size={20} color={colors.onSurface} />
          <TextInput
            testID="journal-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search your little life"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, minHeight: 52, paddingHorizontal: 10, color: colors.onSurface, fontWeight: "600" }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 22 }}>
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                testID={`journal-filter-${item.toLowerCase()}`}
                key={item}
                onPress={() => setFilter(item)}
                style={({ pressed }) => [
                  { flexShrink: 0, minHeight: 40, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: active ? colors.brand : colors.surface, borderWidth: 1.5, borderColor: colors.onSurface },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={{ color: active ? colors.onBrand : colors.onSurface, fontSize: 13, fontWeight: "900" }}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeading eyebrow={`${visible.length} saved`} title="Your story so far" action="Capture" onAction={() => router.push("/capture")} colors={colors} />

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.muted, { marginTop: 10 }]}>Turning pages...</Text>
          </View>
        ) : loadError ? (
          <RetryState message="Your little pages are taking a moment." onRetry={load} colors={colors} />
        ) : visible.length === 0 ? (
          <View style={[styles.card, { padding: 30, alignItems: "center", gap: 14, backgroundColor: colors.paper, borderColor: colors.onSurface, borderWidth: 2 }]}>
            <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.hotPink, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], borderWidth: 2, borderColor: colors.onSurface }}>
              <Ionicons name="book" size={38} color={colors.onSurface} />
            </View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Your story starts here.</Text>
            <Text style={[styles.body, { textAlign: "center" }]}>A blank page is not a missed day. It is space for the next little thing.</Text>
            <Pressable
              testID="journal-add-moment"
              onPress={() => router.push("/capture")}
              style={[styles.button, { backgroundColor: colors.brand, marginTop: 4, borderWidth: 2, borderColor: colors.onSurface }]}
            >
              <Ionicons name="camera" size={19} color={colors.onBrand} />
              <Text style={[styles.buttonText, { color: colors.onBrand }]}>Add a moment</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            {visible.map((memory, index) => <MemoryTile key={memory.id} memory={memory} index={index} colors={colors} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MemoryTile({ memory, index, colors }: { memory: Memory; index: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const router = useRouter();
  const width = "48%" as const;
  const tileBgs = [colors.paper, colors.sky, colors.mint, colors.blush, colors.butter, colors.lavender];
  const bg = tileBgs[index % tileBgs.length];
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/capture", params: { memoryId: memory.id } })}
      style={({ pressed }) => [{ width, marginTop: index % 3 === 1 ? 22 : 0 }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
    >
      <View style={{ backgroundColor: bg, borderRadius: 22, borderWidth: 2, borderColor: colors.onSurface, padding: 8, transform: [{ rotate: index % 2 ? "1.5deg" : "-1.5deg" }] }}>
        <Image source={{ uri: asDataUri(memory.image_base64) }} style={{ width: "100%", height: index % 3 === 0 ? 200 : 160, borderRadius: 15, backgroundColor: colors.surfaceTertiary }} resizeMode="cover" />
        <View style={{ paddingTop: 10, gap: 7 }}>
          <Text style={{ color: colors.onSurface, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }}>{memory.day_key}</Text>
          <MoodStamp mood={memory.mood} colors={colors} compact />
          {memory.caption ? <Text numberOfLines={2} style={{ color: colors.onSurface, fontSize: 12, lineHeight: 17, fontWeight: "700" }}>{memory.caption}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
