import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, asDataUri, type Memory, type Profile, type PromptResponse } from "@/src/api";
import { dayKey, getLittleUserId, prettyDate, PROMPTS } from "@/src/little";
import { ColorRibbon, ConfettiCorner, MoodStamp, RetryState, SectionHeading, StickerRow, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

const GREETINGS = ["Hiiii", "Heyyy", "Hey hey", "Hi friend", "Look who's back"];

function greeting(name: string | undefined | null) {
  const suffix = name && name !== "you" ? `, ${name}` : "";
  const base = GREETINGS[new Date().getDate() % GREETINGS.length];
  return `${base}${suffix}`;
}

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
  const [prompt, setPrompt] = useState<PromptResponse>({ category: "everyday", prompt: PROMPTS[new Date().getDate() % PROMPTS.length] });
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const entrance = useState(() => new Animated.Value(0))[0];
  const wiggle = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, [wiggle]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getLittleUserId();
      const dk = dayKey();
      const [nextProfile, nextMemories, nextPrompt] = await Promise.all([
        api.getProfile(userId),
        api.getMemories(userId),
        api.getPromptToday(dk).catch(() => ({ category: "everyday", prompt: PROMPTS[new Date().getDate() % PROMPTS.length] }) as PromptResponse),
      ]);
      setLoadError(false);
      setProfile(nextProfile);
      setMemories(nextMemories);
      setToday(nextMemories.find((memory) => memory.day_key === dk) ?? null);
      setPrompt(nextPrompt);
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

  const surprise = async () => {
    setSurpriseLoading(true);
    try {
      const next = await api.getPromptSurprise();
      setPrompt(next);
    } catch {
      // ignore
    } finally {
      setSurpriseLoading(false);
    }
  };

  const rotate = wiggle.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WebNav active="today" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <View style={{ gap: 6, flex: 1 }}>
              <Text style={styles.overline}>{prettyDate()}</Text>
              <Text style={styles.h1}>{greeting(profile?.name)} <Text style={{ color: colors.brand }}>✦</Text></Text>
              <Text style={[styles.muted, { marginTop: 2 }]}>a tiny scrapbook of you</Text>
            </View>
            <View style={{ backgroundColor: colors.onSurface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="flame" size={14} color={colors.brand} />
              <Text style={{ color: colors.onSurfaceInverse, fontWeight: "900", fontSize: 12 }}>{memories.length} little{memories.length === 1 ? "" : "s"}</Text>
            </View>
          </View>

          {/* Hero — today's moment */}
          {loading ? (
            <View style={[styles.card, { height: 420, alignItems: "center", justifyContent: "center" }]}>
              <ActivityIndicator color={colors.brand} />
              <Text style={[styles.muted, { marginTop: 10 }]}>Setting the table...</Text>
            </View>
          ) : loadError ? (
            <RetryState message="LITTLE couldn't reach your little world." onRetry={load} colors={colors} />
          ) : today ? (
            <View style={[styles.card, { backgroundColor: colors.paper, position: "relative" }]}>
              <ConfettiCorner colors={colors} />
              <View style={{ padding: 16, paddingBottom: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.overline}>{today.day_key}</Text>
                <MoodStamp mood={today.mood} colors={colors} compact />
              </View>
              <View style={{ margin: 16, height: 360, borderRadius: 22, overflow: "hidden", backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.onSurface }}>
                <Image source={{ uri: asDataUri(today.image_base64) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              </View>
              <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 8 }}>
                <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "900", letterSpacing: -0.3 }}>{today.caption || "A little piece of today."}</Text>
                <Text style={styles.muted}>{today.song ? `♫ ${today.song}` : "Saved privately, just for you."}</Text>
              </View>
            </View>
          ) : (
            <View style={{ position: "relative" }}>
              <LinearGradient
                colors={[colors.hotPink, colors.tangerine, colors.sunny]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { minHeight: 420, padding: 26, justifyContent: "space-between", borderColor: colors.onSurface, borderWidth: 2 }]}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Animated.View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", transform: [{ rotate }], borderWidth: 2, borderColor: colors.onSurface }}>
                    <Ionicons name="sparkles" size={24} color={colors.brand} />
                  </Animated.View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.aqua, borderWidth: 1.5, borderColor: colors.onSurface, transform: [{ rotate: "12deg" }] }} />
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.lime, borderWidth: 1.5, borderColor: colors.onSurface }} />
                    <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: colors.lavender, borderWidth: 1.5, borderColor: colors.onSurface, transform: [{ rotate: "-14deg" }] }} />
                  </View>
                </View>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 40, lineHeight: 44, fontWeight: "900", maxWidth: 300, letterSpacing: -1.5 }}>
                    what{"\u2019"}s today{"\u2019"}s <Text style={{ backgroundColor: colors.onSurface, color: colors.onSurfaceInverse }}> little </Text> moment?
                  </Text>
                  <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: "700" }}>It doesn{"\u2019"}t have to be perfect. Just real. ✨</Text>
                </View>
                <Pressable
                  testID="today-capture-button"
                  onPress={() => router.push("/capture")}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.onSurface, borderWidth: 2, borderColor: colors.onSurface, alignSelf: "flex-start", paddingHorizontal: 24, shadowColor: colors.onSurface, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Ionicons name="camera" size={20} color={colors.onSurfaceInverse} />
                  <Text style={[styles.buttonText, { color: colors.onSurfaceInverse }]}>Capture it</Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* Prompt of the day */}
          <View style={{ marginTop: 30 }}>
            <SectionHeading eyebrow="A tiny nudge" title="Today's little prompt" colors={colors} />
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: colors.surface, borderRadius: 22, padding: 16, borderWidth: 2, borderColor: colors.onSurface }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.sunny, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.onSurface, transform: [{ rotate: "-8deg" }] }}>
                <Ionicons name="eye" size={22} color={colors.onSurface} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" }}>{prompt.category.replace("_", " ")}</Text>
                <Text style={{ color: colors.onSurface, fontSize: 16, lineHeight: 22, fontWeight: "800" }}>{prompt.prompt}</Text>
              </View>
            </View>
            <Pressable
              testID="surprise-me-button"
              onPress={surprise}
              disabled={surpriseLoading}
              style={({ pressed }) => [
                { marginTop: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, minHeight: 44, borderRadius: 999, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.onSurface },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                surpriseLoading && { opacity: 0.6 },
              ]}
            >
              {surpriseLoading ? (
                <ActivityIndicator color={colors.onBrand} size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>🎲</Text>
                  <Text style={{ color: colors.onBrand, fontSize: 13, fontWeight: "900" }}>Surprise me</Text>
                </>
              )}
            </Pressable>
            <View style={{ marginTop: 18 }}><ColorRibbon colors={colors} /></View>
          </View>

          {/* Quick actions */}
          <View style={{ marginTop: 30 }}>
            <SectionHeading eyebrow="Keep it easy" title="Quick little extras" colors={colors} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <QuickAction icon="camera" label="Photo" color={colors.hotPink} textColor={colors.onSurface} onPress={() => router.push("/capture")} />
              <QuickAction icon="sparkles" label="Mood" color={colors.lavender} textColor={colors.onSurface} onPress={() => router.push("/mood")} />
              <QuickAction icon="book" label="Journal" color={colors.mint} textColor={colors.onSurface} onPress={() => router.push("/journal")} />
            </View>
          </View>

          {/* Recent strip */}
          {memories.length > 0 ? (
            <View style={{ marginTop: 30 }}>
              <SectionHeading eyebrow="Rewind" title="Recent little moments" action="See all" onAction={() => router.push("/journal")} colors={colors} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {memories.slice(0, 8).map((memory, index) => (
                  <View key={memory.id} style={{ width: 150, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.onSurface, overflow: "hidden", transform: [{ rotate: `${index % 2 === 0 ? -1.5 : 1.5}deg` }] }}>
                    <View style={{ height: 170, backgroundColor: colors.surfaceTertiary }}>
                      <Image source={{ uri: asDataUri(memory.image_base64) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    </View>
                    <View style={{ padding: 10, gap: 4 }}>
                      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 }}>{memory.day_key}</Text>
                      <Text numberOfLines={1} style={{ color: colors.onSurface, fontSize: 12, fontWeight: "800" }}>{memory.mood} · {memory.caption || "little moment"}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Stickers + privacy */}
          <View style={{ marginTop: 30, padding: 18, borderRadius: 22, backgroundColor: colors.onSurface, gap: 14 }}>
            <StickerRow colors={colors} />
            <Text style={{ color: colors.onSurfaceInverse, fontSize: 15, fontWeight: "800" }}>Your memories are yours. LITTLE keeps them private by default. 🔒</Text>
          </View>
        </Animated.View>
      </ScrollView>
      {showWelcome ? <WelcomeCard profile={profile} onDone={(name) => { setShowWelcome(false); if (profile) setProfile({ ...profile, name }); }} colors={colors} /> : null}
    </View>
  );
}

function QuickAction({ icon, label, color, textColor, onPress }: { icon: "camera" | "sparkles" | "book"; label: string; color: string; textColor: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, minHeight: 82, borderRadius: 20, backgroundColor: color, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 2, borderColor: textColor },
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Ionicons name={icon} size={22} color={textColor} />
      <Text style={{ color: textColor, fontSize: 13, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function WelcomeCard({ profile, onDone, colors }: { profile: Profile | null; onDone: (name: string) => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  const [name, setName] = useState(profile?.name === "you" ? "" : profile?.name ?? "");
  const [step, setStep] = useState(0);
  const save = async () => {
    const userId = await getLittleUserId();
    await api.updateProfile(userId, { name: name.trim() || "you" });
    onDone(name.trim() || "you");
  };
  return (
    <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface, padding: 24, justifyContent: "space-between" }}>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>{step + 1} / 2</Text>
      </View>
      <View style={{ gap: 24 }}>
        <View style={{ width: 92, height: 92, borderRadius: 32, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], borderWidth: 2.5, borderColor: colors.onSurface }}>
          <Ionicons name={step === 0 ? "sparkles" : "person-outline"} size={44} color={colors.onBrand} />
        </View>
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.onSurface, fontSize: 40, lineHeight: 44, fontWeight: "900", letterSpacing: -1.4 }}>
            {step === 0 ? "A tiny place\nfor your life." : "What should\nwe call you?"}
          </Text>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 17, lineHeight: 24, fontWeight: "600" }}>
            {step === 0 ? "One photo. One mood. One little moment at a time." : "Just a name for the little hello at the top of your day."}
          </Text>
        </View>
        {step === 1 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 2, borderColor: colors.onSurface }}>
            <TextInput
              testID="onboarding-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              autoFocus
              style={{ minHeight: 58, color: colors.onSurface, fontSize: 17, fontWeight: "700" }}
            />
          </View>
        ) : null}
      </View>
      <Pressable
        testID={step === 0 ? "onboarding-next" : "onboarding-save"}
        onPress={() => (step === 0 ? setStep(1) : save())}
        style={({ pressed }) => [
          { minHeight: 58, borderRadius: 22, backgroundColor: colors.onSurface, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.onSurface },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ color: colors.onSurfaceInverse, fontSize: 16, fontWeight: "900" }}>{step === 0 ? "Let's make a little magic ✨" : "Start my little world"}</Text>
      </Pressable>
    </View>
  );
}
