import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { CAPTION_TONES, dayKey, getLittleUserId } from "@/src/little";
import { MoodSelector, useLittleStyles, WebNav } from "@/src/components/little-ui";
import { useTheme } from "@/src/theme";

export default function CaptureScreen() {
  const styles = useLittleStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [mood, setMood] = useState("Happy");
  const [caption, setCaption] = useState("");
  const [song, setSong] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [magicTone, setMagicTone] = useState<string | null>(null);
  const [magicLoading, setMagicLoading] = useState(false);

  const choosePhoto = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError("Photo access is off — you can turn it on in Settings."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [4, 5], quality: 0.82, base64: true });
    if (!result.canceled && result.assets[0]?.base64) setImage(result.assets[0].base64);
  };

  const magic = async (tone: string) => {
    setMagicLoading(true);
    setMagicTone(tone);
    setError("");
    try {
      const userId = await getLittleUserId();
      const result = await api.generateCaption({ mood, tone, hint: caption, user_id: userId });
      setCaption(result.caption);
    } catch {
      setError("Caption magic hiccuped, try again in a sec.");
    } finally {
      setMagicLoading(false);
    }
  };

  const save = async () => {
    if (!image) { setError("Pick one little photo first."); return; }
    setSaving(true); setError("");
    try {
      const userId = await getLittleUserId();
      await api.saveMemory({
        user_id: userId,
        day_key: dayKey(),
        image_base64: image,
        mood,
        mood_emoji: mood,
        caption: caption.trim(),
        song: song.trim(),
        location: "",
        is_core: false,
      });
      router.replace("/(tabs)");
    } catch {
      setError("That moment stayed local for now. Try saving again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <WebNav active="capture" colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <View style={{ gap: 4 }}>
            <Text style={styles.overline}>New memory</Text>
            <Text style={styles.h1}>Make it a moment.</Text>
          </View>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.hotPink, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.onSurface, transform: [{ rotate: "-8deg" }] }}>
            <Ionicons name="camera" size={24} color={colors.onSurface} />
          </View>
        </View>

        {image ? (
          <View style={{ borderRadius: 24, overflow: "hidden", backgroundColor: colors.surfaceTertiary, height: 380, marginBottom: 18, borderWidth: 2, borderColor: colors.onSurface }}>
            <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <Pressable
              testID="remove-photo-button"
              onPress={() => setImage(null)}
              style={{ position: "absolute", top: 14, right: 14, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.onSurface }}
            >
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
            <View style={{ position: "absolute", bottom: 14, left: 14, backgroundColor: colors.onSurface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: colors.onSurfaceInverse, fontSize: 11, fontWeight: "900", letterSpacing: 1 }}>{dayKey()}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            testID="capture-photo-button"
            onPress={choosePhoto}
            accessibilityRole="button"
            style={({ pressed }) => [
              { height: 380, borderRadius: 24, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.onSurface, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 14 },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.hotPink, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], borderWidth: 2, borderColor: colors.onSurface }}>
              <Ionicons name="images" size={38} color={colors.onSurface} />
            </View>
            <Text style={{ color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>Add today{"\u2019"}s photo</Text>
            <Text style={styles.muted}>A coffee, a sky, a tiny win.</Text>
          </Pressable>
        )}

        <View style={{ marginTop: 26, gap: 24 }}>
          <MoodSelector selected={mood} onSelect={setMood} colors={colors} />

          {/* Caption + AI Magic */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: "900" }}>Want to remember anything?</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="sparkles" size={14} color={colors.brand} />
                <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }}>Caption Magic</Text>
              </View>
            </View>
            <TextInput
              testID="caption-input"
              value={caption}
              onChangeText={setCaption}
              placeholder="tiny thought..."
              placeholderTextColor={colors.muted}
              multiline
              style={{ minHeight: 96, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.onSurface, padding: 16, color: colors.onSurface, fontSize: 15, textAlignVertical: "top", fontWeight: "600" }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
              {CAPTION_TONES.map((tone) => {
                const active = magicTone === tone.key && magicLoading;
                return (
                  <Pressable
                    key={tone.key}
                    testID={`caption-tone-${tone.key}`}
                    onPress={() => magic(tone.key)}
                    disabled={magicLoading}
                    style={({ pressed }) => [
                      { minHeight: 40, borderRadius: 999, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.onSurface },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                      magicLoading && !active && { opacity: 0.5 },
                    ]}
                  >
                    {active ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 14 }}>{tone.emoji}</Text>
                        <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "800" }}>{tone.label}</Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.muted}>Tap a tone to let LITTLE write it for you ✨</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.onSurface, paddingHorizontal: 14 }}>
            <Ionicons name="musical-notes" size={20} color={colors.brand} />
            <TextInput
              testID="song-input"
              value={song}
              onChangeText={setSong}
              placeholder="Add a soundtrack (optional)"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, minHeight: 54, paddingHorizontal: 10, color: colors.onSurface, fontWeight: "600" }}
            />
          </View>
        </View>

        {error ? (
          <Text testID="capture-error" style={{ color: colors.error, fontSize: 13, fontWeight: "800", marginTop: 14 }}>{error}</Text>
        ) : null}

        <Pressable
          testID="save-memory-button"
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.brand, marginTop: 24, marginBottom: 10, borderWidth: 2, borderColor: colors.onSurface, shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            saving && { opacity: 0.6 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={colors.onBrand} />
              <Text style={[styles.buttonText, { color: colors.onBrand }]}>Secure this memory</Text>
            </>
          )}
        </Pressable>
        <Text style={[styles.muted, { textAlign: "center" }]}>One photo is enough. Everything else is optional.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
