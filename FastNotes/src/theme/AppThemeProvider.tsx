import { createContext, useContext, useEffect, useState } from "react"
import { Appearance } from "react-native"

import { AppColorScheme, getThemePalette } from "@/src/theme/palette"

type AppThemeContextValue = {
    colorScheme: AppColorScheme
    palette: ReturnType<typeof getThemePalette>
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined)

function resolveColorScheme(colorScheme: "light" | "dark" | null | undefined): AppColorScheme {
    return colorScheme === "dark" ? "dark" : "light"
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorScheme, setColorScheme] = useState<AppColorScheme>(() =>
        resolveColorScheme(Appearance.getColorScheme())
    )

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme: nextColorScheme }) => {
            setColorScheme(resolveColorScheme(nextColorScheme))
        })

        setColorScheme(resolveColorScheme(Appearance.getColorScheme()))

        return () => {
            subscription.remove()
        }
    }, [])

    return (
        <AppThemeContext.Provider
            value={{
                colorScheme,
                palette: getThemePalette(colorScheme),
            }}
        >
            {children}
        </AppThemeContext.Provider>
    )
}

export function useAppTheme() {
    const value = useContext(AppThemeContext)

    if (!value) {
        throw new Error("useAppTheme must be used inside AppThemeProvider")
    }

    return value
}

export function useAppColorScheme() {
    return useAppTheme().colorScheme
}
