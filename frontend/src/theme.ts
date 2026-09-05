// Design tokens for LITTLE. Bold, playful, Gen-Z scrapbook palette.
// Every screen imports colors via useTheme() / makeStyles. Never inline hex
// literals in components (only when a color must stay identical in light &
// dark — rare here).

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#FFFCF4",
  onSurface: "#221F1B",
  surfaceSecondary: "#FFF3E5",
  onSurfaceSecondary: "#3A342C",
  surfaceTertiary: "#FCE7D4",
  onSurfaceTertiary: "#4B4238",
  surfaceInverse: "#1B1815",
  onSurfaceInverse: "#FFFCF4",
  muted: "#8A7F70",

  // Brand — bolder strawberry
  brand: "#FF3E7F",
  onBrand: "#FFFCF4",
  brandPrimary: "#FF3E7F",
  onBrandPrimary: "#FFFCF4",
  brandSecondary: "#FFB020",
  onBrandSecondary: "#221F1B",
  brandTertiary: "#FFD3E2",
  onBrandTertiary: "#B01553",

  // Confetti palette — richer, more saturated
  peach: "#FFC2A8",
  coral: "#FF6E4E",
  sunny: "#FFD24C",
  lavender: "#D8C6FF",
  sky: "#B7E3FF",
  mint: "#B6F0C7",
  paper: "#FFEED1",
  hotPink: "#FF3E9C",
  aqua: "#7BE0DE",
  lime: "#D4F26A",
  tangerine: "#FF8A3D",
  grape: "#8A5CF6",
  blush: "#FFB4C2",
  butter: "#FFF0A1",

  // Status
  success: "#22C55E",
  onSuccess: "#FFFCF4",
  warning: "#F59E0B",
  onWarning: "#221F1B",
  error: "#EF4444",
  onError: "#FFFCF4",
  info: "#3B82F6",
  onInfo: "#FFFCF4",

  // Lines
  border: "#F0DFC1",
  borderStrong: "#DDBF8E",
  divider: "#F5E7CB",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
