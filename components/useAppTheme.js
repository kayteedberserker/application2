import { useColorScheme } from "react-native";
const colorScheme = useColorScheme();
const isDark = colorScheme === "dark";

const THEME = {
  isDark,

  bg: isDark ? "#0a0a0a" : "#ffffff",
  card: isDark ? "#111111" : "#f8fafc",

  text: isDark ? "#e5e7eb" : "#111827",
  subText: isDark ? "#9ca3af" : "#6b7280",

  border: isDark ? "#1f2937" : "#e5e7eb",

  accent: "#2563eb",
  danger: "#ef4444",
  success: "#22c55e",
};

export default THEME;
