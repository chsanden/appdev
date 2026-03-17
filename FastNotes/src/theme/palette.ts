export type AppColorScheme = "light" | "dark"

const lightPalette = {
    background: "#f5efe6",
    surface: "#fffdf8",
    elevated: "#ffffff",
    text: "#111111",
    mutedText: "#5f5a52",
    border: "#77736e",
    input: "#ffffff",
    accent: "#111111",
    destructive: "#b71c1c",
    statusBar: "#fffdf8",
}

const darkPalette = {
    background: "#191919",
    surface: "#343232",
    elevated: "#111111",
    text: "#ffffff",
    mutedText: "#b8b8b8",
    border: "#ffffff",
    input: "#151515",
    accent: "#ffffff",
    destructive: "#ff6b6b",
    statusBar: "#000000",
}

export function getThemePalette(colorScheme: AppColorScheme) {
    return colorScheme === "dark" ? darkPalette : lightPalette
}
