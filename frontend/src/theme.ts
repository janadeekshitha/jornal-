// Design tokens for this app. Light theme only.Always modify the colors and theme to Dark, Light or Dark and Light according to the design guidelines.
//
// The keys match the "color" block of /app/design_guidelines.json. Fill the
// values from that file (or from the user's brand colors). Keep every key; do
// not add a second theme or colors file; do not write color literals in
// components.
//
// How the names work: a plain key is a background, and its `on` partner is the
// text or icon color that sits on top of it. Always use them as a pair.
//   <View style={{ backgroundColor: colors.brandPrimary }}>
//     <Text style={{ color: colors.onBrandPrimary }}>Continue</Text>
//   </View>
//
// Styling a screen or component: build the sheet with makeStyles so colors
// and layout live together and follow the active scheme:
//   const useStyles = makeStyles((colors) => ({
//     card: { backgroundColor: colors.surfaceSecondary, padding: 16 },
//     title: { color: colors.onSurfaceSecondary, fontSize: 16 },
//   }));
//   function Screen() {
//     const styles = useStyles();
//     return <View style={styles.card}><Text style={styles.title}>Hi</Text></View>;
//   }
// For color props that are not styles (icon color, placeholderTextColor,
// ActivityIndicator) read useTheme().colors inside the component.
// Never call StyleSheet.create with color values at module level; it cannot
// follow the scheme.
//
// To support dark mode later: add `dark` to `themes` with every key filled.
// Nothing else changes; the device setting takes over automatically.
// Feel free to add as many new colors as you need to support the design guidelines.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // ---------------------------------------------------------------------------
  // Surfaces: backgrounds, from the screen down to small fills.
  // Each `on` key is the text and icon color for that background.
  // ---------------------------------------------------------------------------
  surface: "#FFFDF9",
  onSurface: "#2D2A26",
  surfaceSecondary: "#F8F4EC",
  onSurfaceSecondary: "#4A453F",
  surfaceTertiary: "#F0EAE1",
  onSurfaceTertiary: "#635D55",
  surfaceInverse: "#2D2A26",
  onSurfaceInverse: "#FFFDF9",
  muted: "#8C847A",

  // ---------------------------------------------------------------------------
  // Brand: the identity color and the fills built from it.
  // Neutral by default; replace with the design guidelines values.
  // ---------------------------------------------------------------------------
  brand: "#FF6B6B",
  onBrand: "#FFFDF9",
  brandPrimary: "#FF6B6B",
  onBrandPrimary: "#FFFDF9",
  brandSecondary: "#FFB84D",
  onBrandSecondary: "#2D2A26",
  brandTertiary: "#FFE3E3",
  onBrandTertiary: "#D93838",
  peach: "#FFD5C8",
  coral: "#FF8A72",
  sunny: "#FFD166",
  lavender: "#E7DDFF",
  sky: "#DDF3FF",
  mint: "#DFF7E8",
  paper: "#FFF7E8",

  // ---------------------------------------------------------------------------
  // Status: semantic only, never decorative. Fill for badges, banners and
  // toasts; the `on` key is text on that fill. The plain key is also safe as
  // text on `surface`.
  // ---------------------------------------------------------------------------
  success: "#4CAF50",
  onSuccess: "#FFFDF9",
  warning: "#FF9800",
  onWarning: "#FFFDF9",
  error: "#E53935",
  onError: "#FFFDF9",
  info: "#2196F3",
  onInfo: "#FFFDF9",

  // ---------------------------------------------------------------------------
  // Lines
  // ---------------------------------------------------------------------------
  border: "#E6DEC7",
  borderStrong: "#D1C5A5",
  divider: "#EFEBD9",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

// In-app theme toggle, only after `dark` exists in `themes`. Call
// setColorScheme("dark"), setColorScheme("light"), or setColorScheme(null) to
// follow the device. Every useTheme() consumer re-renders. Persisting the
// choice and re-applying it on launch is the toggle's job.
export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

// Keep native surfaces (alerts, pickers, navigation chrome) on the schemes this
// app ships: light only forces light; once `dark` exists the device decides.
// Optional call because react-native-web does not implement it.
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

// Themed StyleSheet: returns a hook that builds the sheet from the active
// scheme's colors and memoizes it until the scheme changes.
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}


