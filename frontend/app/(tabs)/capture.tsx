import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { dayKey, getLittleUserId } from "@/src/little";
import { MoodSelector, useLittleStyles } from "@/src/components/little-ui";
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

  const choosePhoto = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError("Photo access is off — you can turn it on in Settings."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [4, 5], quality: 0.82, base64: true });
    if (!result.canceled && result.assets[0]?.base64) setImage(result.assets[0].base64);
  };

  const save = async () => {
    if (!image) { setError("Pick one little photo first."); return; }
    setSaving(true); setError("");
    try {
      const userId = await getLittleUserId();
      await api.saveMemory({ user_id: userId, day_key: dayKey(), image_base64: image, mood, mood_emoji: mood, caption: caption.trim(), song: song.trim(), location: "", is_core: false });
      router.replace("/(tabs)");
    } catch { setError("That moment stayed local for now. Try saving again."); } finally { setSaving(false); }
  };

  return <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}><View><Text style={styles.overline}>New memory</Text><Text style={styles.h1}>Make it a moment.</Text></View><View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center" }}><Ionicons name="camera" size={22} color={colors.onSurface} /></View></View>
    {image ? <View style={{ borderRadius: 24, overflow: "hidden", backgroundColor: colors.surfaceTertiary, height: 360, marginBottom: 18 }}><Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /><Pressable testID="remove-photo-button" onPress={() => setImage(null)} style={{ position: "absolute", top: 14, right: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><Ionicons name="close" size={22} color={colors.onSurface} /></Pressable></View> : <Pressable testID="capture-photo-button" onPress={choosePhoto} accessibilityRole="button" style={({ pressed }) => [{ height: 360, borderRadius: 24, backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 13 }, pressed && { opacity: 0.78, transform: [{ scale: 0.99 }] }]}><View style={{ width: 74, height: 74, borderRadius: 26, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] }}><Ionicons name="images-outline" size={34} color={colors.onSurface} /></View><Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "800" }}>Add today's photo</Text><Text style={styles.muted}>A coffee, a sky, a tiny win.</Text></Pressable>}
    <View style={{ marginTop: 24, gap: 24 }}><MoodSelector selected={mood} onSelect={setMood} colors={colors} /><View style={{ gap: 10 }}><Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "800" }}>Want to remember anything?</Text><TextInput testID="caption-input" value={caption} onChangeText={setCaption} placeholder="tiny thought..." placeholderTextColor={colors.muted} multiline style={{ minHeight: 92, backgroundColor: colors.surfaceSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15, color: colors.onSurface, fontSize: 15, textAlignVertical: "top" }} /></View><View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 17, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 }}><Ionicons name="musical-notes-outline" size={20} color={colors.brandPrimary} /><TextInput testID="song-input" value={song} onChangeText={setSong} placeholder="Add a soundtrack (optional)" placeholderTextColor={colors.muted} style={{ flex: 1, minHeight: 50, paddingHorizontal: 10, color: colors.onSurface }} /></View></View>
    {error ? <Text testID="capture-error" style={{ color: colors.error, fontSize: 13, fontWeight: "700", marginTop: 14 }}>{error}</Text> : null}<Pressable testID="save-memory-button" onPress={save} disabled={saving} style={({ pressed }) => [styles.button, { backgroundColor: colors.brandPrimary, marginTop: 22, marginBottom: 10 }, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}>{saving ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><Ionicons name="sparkles-outline" size={20} color={colors.onBrandPrimary} /><Text style={[styles.buttonText, { color: colors.onBrandPrimary }]}>Secure this memory</Text></>}</Pressable><Text style={[styles.muted, { textAlign: "center" }]}>One photo is enough. Everything else is optional.</Text></ScrollView></KeyboardAvoidingView>;
}