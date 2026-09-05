import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, asDataUri, type Memory, type Profile } from "@/src/api";
import { dayKey, getLittleUserId, prettyDate, PROMPTS } from "@/src/little";
import { MoodStamp, RetryState, SectionHeading, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

export default function TodayScreen() {
  const styles = useLittleStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [today, setToday] = useState<Memory | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [prompt] = useState(PROMPTS[new Date().getDate() % PROMPTS.length]);
  const entrance = useState(() => new Animated.Value(0))[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getLittleUserId();
      const [nextProfile, nextMemories] = await Promise.all([api.getProfile(userId), api.getMemories(userId)]);
      setLoadError(false);
      setProfile(nextProfile);
      setMemories(nextMemories);
      setToday(nextMemories.find((memory) => memory.day_key === dayKey()) ?? null);
      setShowWelcome(!nextProfile.name || nextProfile.name === "you");
    } catch (error) {
      setLoadError(true);
      console.warn("Today load failed", error);
    } finally {
      setLoading(false);
      Animated.spring(entrance, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
    }
  }, [entrance]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WebNav active="today" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <View style={{ gap: 4 }}><Text style={styles.overline}>{prettyDate()}</Text><Text style={styles.h1}>Hey{profile?.name && profile.name !== "you" ? `, ${profile.name}` : "yy"} <Text style={{ color: colors.brandPrimary }}>✦</Text></Text></View>
            <View style={{ backgroundColor: colors.brandTertiary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 }}><Ionicons name="flame-outline" size={16} color={colors.onBrandTertiary} /><Text style={{ color: colors.onBrandTertiary, fontWeight: "800", fontSize: 12 }}>{memories.length} little{memories.length === 1 ? "" : "s"}</Text></View>
          </View>

          {loading ? <View style={[styles.card, { height: 390, alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.muted, { marginTop: 10 }]}>Setting the table...</Text></View> : loadError ? <RetryState message="LITTLE couldn't reach your little world." onRetry={load} colors={colors} /> : today ? <View style={[styles.card, { backgroundColor: colors.paper }]}>
            <View style={{ padding: 14, paddingBottom: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={styles.overline}>{today.day_key}</Text><MoodStamp mood={today.mood} colors={colors} compact /></View>
            <View style={{ margin: 14, height: 350, borderRadius: 18, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}><Animated.Image source={{ uri: asDataUri(today.image_base64) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /></View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 20, gap: 8 }}><Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "800" }}>{today.caption || "A little piece of today."}</Text><Text style={styles.muted}>{today.song ? `♫ ${today.song}` : "Saved privately, just for you."}</Text></View>
          </View> : <LinearGradient colors={[colors.peach, colors.paper, colors.sky]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { minHeight: 390, padding: 24, justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-10deg" }] }}><Ionicons name="sparkles" size={22} color={colors.brandPrimary} /></View><Text style={{ color: colors.onSurfaceSecondary, fontSize: 30, transform: [{ rotate: "12deg" }] }}>~</Text></View>
            <View style={{ gap: 10 }}><Text style={{ color: colors.onSurface, fontSize: 30, lineHeight: 35, fontWeight: "800", maxWidth: 270 }}>What's today's little moment?</Text><Text style={{ color: colors.onSurfaceSecondary, fontSize: 15 }}>It doesn't have to be perfect. Just real.</Text></View>
            <Pressable testID="today-capture-button" onPress={() => router.push("/capture")} accessibilityRole="button" style={({ pressed }) => [styles.button, { backgroundColor: colors.onSurface }, pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }]}><Ionicons name="camera-outline" size={20} color={colors.onSurfaceInverse} /><Text style={[styles.buttonText, { color: colors.onSurfaceInverse }]}>Capture it</Text></Pressable>
          </LinearGradient>}

          <View style={{ marginTop: 28 }}><SectionHeading eyebrow="A tiny nudge" title="Today's little prompt" colors={colors} /><View style={{ flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border }}><View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.sunny, alignItems: "center", justifyContent: "center" }}><Ionicons name="eye-outline" size={22} color={colors.onSurface} /></View><Text style={{ flex: 1, color: colors.onSurface, fontSize: 16, lineHeight: 22, fontWeight: "700" }}>{prompt}</Text></View></View>
          <View style={{ marginTop: 28 }}><SectionHeading eyebrow="Keep it easy" title="Quick little extras" colors={colors} /><View style={{ flexDirection: "row", gap: 9 }}><QuickAction icon="camera-outline" label="Photo" color={colors.peach} onPress={() => router.push("/capture")} colors={colors} /><QuickAction icon="sparkles-outline" label="Mood" color={colors.lavender} onPress={() => router.push("/mood")} colors={colors} /><QuickAction icon="create-outline" label="Note" color={colors.mint} onPress={() => router.push("/capture")} colors={colors} /></View></View>
          <View style={{ marginTop: 30, padding: 16, borderRadius: 20, backgroundColor: colors.surfaceTertiary, flexDirection: "row", gap: 12, alignItems: "center" }}><Ionicons name="lock-closed-outline" size={19} color={colors.onSurfaceTertiary} /><Text style={[styles.muted, { flex: 1 }]}>Your memories are yours. LITTLE keeps them private by default.</Text></View>
        </Animated.View>
      </ScrollView>
      {showWelcome ? <WelcomeCard profile={profile} onDone={(name) => { setShowWelcome(false); if (profile) setProfile({ ...profile, name }); }} colors={colors} /> : null}
    </View>
  );
}

function QuickAction({ icon, label, color, onPress, colors }: { icon: "camera-outline" | "sparkles-outline" | "create-outline"; label: string; color: string; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, minHeight: 74, borderRadius: 18, backgroundColor: color, alignItems: "center", justifyContent: "center", gap: 6 }, pressed && { opacity: 0.78, transform: [{ scale: 0.96 }] }]}><Ionicons name={icon} size={22} color={colors.onSurface} /><Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "800" }}>{label}</Text></Pressable>;
}

function WelcomeCard({ profile, onDone, colors }: { profile: Profile | null; onDone: (name: string) => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  const [name, setName] = useState(profile?.name === "you" ? "" : profile?.name ?? "");
  const [step, setStep] = useState(0);
  const save = async () => { const userId = await getLittleUserId(); await api.updateProfile(userId, { name: name.trim() || "you" }); onDone(name.trim() || "you"); };
  return <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface, padding: 24, justifyContent: "space-between" }}><View style={{ alignItems: "flex-end" }}><Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{step + 1} / 2</Text></View><View style={{ gap: 24 }}><View style={{ width: 88, height: 88, borderRadius: 32, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] }}><Ionicons name={step === 0 ? "sparkles" : "person-outline"} size={40} color={colors.onBrandPrimary} /></View><View style={{ gap: 12 }}><Text style={{ color: colors.onSurface, fontSize: 38, lineHeight: 42, fontWeight: "800", letterSpacing: -1.2 }}>{step === 0 ? "A tiny place\nfor your life." : "What should\nwe call you?"}</Text><Text style={{ color: colors.onSurfaceSecondary, fontSize: 17, lineHeight: 24 }}>{step === 0 ? "One photo. One mood. One little moment at a time." : "Just a name for the little hello at the top of your day."}</Text></View>{step === 1 ? <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border }}><TextInput testID="onboarding-name-input" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} autoFocus style={{ minHeight: 56, color: colors.onSurface, fontSize: 16 }} /></View> : null}</View><Pressable testID={step === 0 ? "onboarding-next" : "onboarding-save"} onPress={() => step === 0 ? setStep(1) : save()} style={({ pressed }) => [{ minHeight: 56, borderRadius: 20, backgroundColor: colors.onSurface, alignItems: "center", justifyContent: "center" }, pressed && { opacity: 0.8 }]}><Text style={{ color: colors.onSurfaceInverse, fontSize: 16, fontWeight: "800" }}>{step === 0 ? "Let's make a little magic" : "Start my little world"}</Text></Pressable></View>;
}