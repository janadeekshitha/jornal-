import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type Achievement, type AchievementsResponse, type Profile } from "@/src/api";
import { getLittleUserId } from "@/src/little";
import { RetryState, SectionHeading, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

export default function MeScreen() {
  const styles = useLittleStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<AchievementsResponse | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const id = await getLittleUserId();
      const [nextProfile, nextAchievements] = await Promise.all([api.getProfile(id), api.getAchievements(id)]);
      setProfile(nextProfile);
      setName(nextProfile.name === "you" ? "" : nextProfile.name);
      setAchievements(nextAchievements);
    } catch (error) {
      setLoadError(true);
      console.warn("Profile load failed", error);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    setSaving(true);
    try {
      const next = await api.updateProfile(await getLittleUserId(), { name: name.trim() || "you" });
      setProfile(next);
    } finally {
      setSaving(false);
    }
  };

  const totalMemories = achievements?.total_memories ?? 0;
  const streak = achievements?.streak ?? 0;
  const coreCount = achievements?.core_count ?? 0;
  const unlockedCount = achievements?.achievements.filter((ach) => ach.unlocked).length ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WebNav active="me" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>Your little world</Text>
        <Text style={styles.h1}>Me <Text style={{ color: colors.brand }}>✦</Text></Text>

        {loadError ? (
          <RetryState message="Your little world is taking a moment." onRetry={load} colors={colors} />
        ) : (
          <>
            {/* Hero identity card */}
            <View style={[styles.card, { marginTop: 22, padding: 22, backgroundColor: colors.hotPink, borderColor: colors.onSurface, borderWidth: 2 }]}>
              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <View style={{ width: 78, height: 78, borderRadius: 26, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], borderWidth: 2, borderColor: colors.onSurface }}>
                  <Text style={{ color: colors.brand, fontSize: 32, fontWeight: "900" }}>{(profile?.name || "L").slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }}>{profile?.name && profile.name !== "you" ? profile.name : "Your name"}</Text>
                  <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "700" }}>A private scrapbook, in progress ✦</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", marginTop: 24, gap: 10 }}>
                <Stat number={String(totalMemories)} label="moments" colors={colors} />
                <Stat number={String(streak)} label="day streak" colors={colors} />
                <Stat number={String(coreCount)} label="core" colors={colors} />
              </View>
            </View>

            {/* Name editor */}
            <View style={{ marginTop: 30 }}>
              <SectionHeading eyebrow="Personalize" title="Your hello" colors={colors} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  testID="profile-name-input"
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  placeholderTextColor={colors.muted}
                  style={{ flex: 1, minHeight: 54, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.onSurface, paddingHorizontal: 16, color: colors.onSurface, fontWeight: "700" }}
                />
                <Pressable
                  testID="profile-save-button"
                  onPress={save}
                  disabled={saving}
                  style={[styles.button, { backgroundColor: colors.onSurface, minWidth: 86, paddingHorizontal: 14, borderWidth: 2, borderColor: colors.onSurface }]}
                >
                  {saving ? <ActivityIndicator color={colors.onSurfaceInverse} /> : <Text style={[styles.buttonText, { color: colors.onSurfaceInverse }]}>Save</Text>}
                </Pressable>
              </View>
            </View>

            {/* Achievements */}
            <View style={{ marginTop: 34 }}>
              <SectionHeading
                eyebrow="Little wins"
                title={`Achievements · ${unlockedCount}/${achievements?.achievements.length ?? 0}`}
                colors={colors}
              />
              {!achievements ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {achievements.achievements.map((ach) => (
                    <AchievementCard key={ach.id} achievement={ach} colors={colors} />
                  ))}
                </View>
              )}
            </View>

            {/* Settings */}
            <View style={{ marginTop: 34 }}>
              <SectionHeading eyebrow="Keep it yours" title="Little settings" colors={colors} />
              <SettingRow icon="lock-closed-outline" title="Privacy first" detail="Your memories are private by default" colors={colors} />
              <SettingRow icon="notifications-outline" title="Friendly reminders" detail="Choose if and when LITTLE nudges you" colors={colors} />
              <SettingRow icon="download-outline" title="Export your story" detail="Take your memories with you" colors={colors} />
              <SettingRow icon="information-circle-outline" title="About LITTLE" detail="One photo. One mood. One moment." colors={colors} />
            </View>

            <View style={{ marginTop: 22, padding: 18, borderRadius: 22, backgroundColor: colors.onSurface, flexDirection: "row", gap: 10 }}>
              <Ionicons name="heart" size={20} color={colors.brand} />
              <Text style={{ flex: 1, color: colors.onSurfaceInverse, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>Missing a day is okay. The blank pages are part of the story too. ✨</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ number, label, colors }: { number: string; label: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ flex: 1, gap: 2, backgroundColor: colors.surface, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: colors.onSurface, alignItems: "flex-start" }}>
      <Text style={{ color: colors.onSurface, fontSize: 24, fontWeight: "900", letterSpacing: -0.6 }}>{number}</Text>
      <Text style={{ color: colors.onSurfaceSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</Text>
    </View>
  );
}

function AchievementCard({ achievement, colors }: { achievement: Achievement; colors: ReturnType<typeof useTheme>["colors"] }) {
  const pct = Math.min(1, achievement.progress / Math.max(1, achievement.target));
  const bg = achievement.unlocked ? colors.sunny : colors.surface;
  return (
    <View
      testID={`achievement-${achievement.id}`}
      style={{ width: "48%", padding: 14, borderRadius: 20, borderWidth: 2, borderColor: colors.onSurface, backgroundColor: bg, gap: 8, opacity: achievement.unlocked ? 1 : 0.86 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22 }}>{achievement.emoji}</Text>
        {achievement.unlocked ? (
          <View style={{ backgroundColor: colors.onSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
            <Text style={{ color: colors.onSurfaceInverse, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }}>UNLOCKED</Text>
          </View>
        ) : (
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "900" }}>{achievement.progress}/{achievement.target}</Text>
        )}
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: -0.2 }}>{achievement.title}</Text>
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "600", lineHeight: 15 }}>{achievement.detail}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 999, overflow: "hidden", borderWidth: 1, borderColor: colors.onSurface }}>
        <View style={{ height: "100%", width: `${Math.max(6, pct * 100)}%`, backgroundColor: colors.brand }} />
      </View>
    </View>
  );
}

function SettingRow({ icon, title, detail, colors }: { icon: "lock-closed-outline" | "notifications-outline" | "download-outline" | "information-circle-outline"; title: string; detail: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <Pressable
      style={({ pressed }) => [
        { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.onSurface }}>
        <Ionicons name={icon} size={22} color={colors.onSurface} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
