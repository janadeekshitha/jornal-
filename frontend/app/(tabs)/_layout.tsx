import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme";

const useNativeTabs = Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

function NativeTabBar() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md={{ default: "home", selected: "home_filled" }} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="capture">
        <NativeTabs.Trigger.Icon sf={{ default: "camera", selected: "camera.fill" }} md={{ default: "photo_camera", selected: "photo_camera" }} />
        <NativeTabs.Trigger.Label>Capture</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="journal">
        <NativeTabs.Trigger.Icon sf={{ default: "book", selected: "book.fill" }} md={{ default: "menu_book", selected: "menu_book" }} />
        <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mood">
        <NativeTabs.Trigger.Icon sf={{ default: "circle.grid.2x2", selected: "circle.grid.2x2.fill" }} md={{ default: "auto_awesome", selected: "auto_awesome" }} />
        <NativeTabs.Trigger.Label>Mood</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md={{ default: "person", selected: "person" }} />
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  if (useNativeTabs) return <NativeTabBar />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { ...(Platform.OS === "web" ? { height: 64 } : {}) },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarButtonTestID: "tab-today", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="capture" options={{ title: "Capture", tabBarButtonTestID: "tab-capture", tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" size={size + 2} color={color} /> }} />
      <Tabs.Screen name="journal" options={{ title: "Journal", tabBarButtonTestID: "tab-journal", tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="mood" options={{ title: "Mood", tabBarButtonTestID: "tab-mood", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarButtonTestID: "tab-me", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}