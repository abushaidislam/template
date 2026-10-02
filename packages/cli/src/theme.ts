import pc from "picocolors";

export const THEME = {
  primary: "#cc785c",
  primaryActive: "#a9583e",
  primaryDisabled: "#e6dfd8",
  ink: "#141413",
  body: "#3d3d3a",
  bodyStrong: "#252523",
  muted: "#6c6a64",
  mutedSoft: "#8e8b82",
  hairline: "#e6dfd8",
  hairlineSoft: "#ebe6df",
  canvas: "#faf9f5",
  surfaceCard: "#efe9de",
  surfaceCreamStrong: "#e8e0d2",
  surfaceDark: "#181715",
  surfaceDarkElevated: "#252320",
  surfaceDarkSoft: "#1f1e1b",
  teal: "#5db8a6",
  amber: "#e8a55a",
  success: "#5db872",
  error: "#c64545"
} as const;

export const ansiHex = (hexColor: string) => {
  const num = parseInt(hexColor.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
};

export const colors = {
  coral: ansiHex(THEME.primary),
  coralActive: ansiHex(THEME.primaryActive),
  muted: ansiHex(THEME.muted),
  mutedSoft: ansiHex(THEME.mutedSoft),
  teal: ansiHex(THEME.teal),
  amber: ansiHex(THEME.amber),
  green: ansiHex(THEME.success),
  red: ansiHex(THEME.error),
  hairline: ansiHex(THEME.hairline),
  canvas: ansiHex(THEME.canvas)
};

export const stripAnsi = (str: string): string => {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\([B0]/g, "");
};

export const visibleWidth = (str: string): number => {
  return stripAnsi(str).length;
};
