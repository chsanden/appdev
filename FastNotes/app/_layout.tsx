import { useAuthContext } from '@/hooks/use-auth-context'
import AuthProvider from '@/providers/auth-provider'
import { NotesProvider } from "@/src/notes/NotesContext"
import { AppThemeProvider, useAppTheme } from '@/src/theme/AppThemeProvider'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import Constants from "expo-constants"
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ComponentType, PropsWithChildren, useEffect, useState } from "react"
import { Platform } from "react-native"
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'


// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuthContext()
  const { palette } = useAppTheme()

  if (isLoading) {
    return null
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
        headerStyle: { backgroundColor: palette.surface },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text },
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="index" options={{ headerShown: false,title: "Notes", headerBackTitle: "Notes" }} />
        <Stack.Screen name="newNote" options={{ headerShown: true, title: 'New Note' }} />
        <Stack.Screen name="detail" options={{ headerShown: true, title: 'Note' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

function ThemedRootLayout() {
  const { colorScheme, palette } = useAppTheme()
  const navigationTheme = colorScheme === "dark"
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          primary: palette.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          primary: palette.accent,
        },
      }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <NotificationProviderGate>
            <NotesProvider>
              <RootNavigator />
            </NotesProvider>
          </NotificationProviderGate>
        </AuthProvider>
        <StatusBar
          style={colorScheme === "dark" ? "light" : "dark"}
          backgroundColor={palette.statusBar}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function NotificationProviderGate({ children }: PropsWithChildren) {
  const isAndroidExpoGo = Platform.OS === "android" && Constants.executionEnvironment === "storeClient"
  const [provider, setProvider] = useState<ComponentType<PropsWithChildren> | null>(null)

  useEffect(() => {
    if (isAndroidExpoGo) {
      return
    }

    let isMounted = true

    const loadProvider = async () => {
      try {
        const module = await import("@/src/notifications/PushNotificationsProvider")

        if (isMounted) {
          setProvider(() => module.default)
        }
      } catch (error) {
        console.error("Failed to load push notifications provider:", error)
      }
    }

    void loadProvider()

    return () => {
      isMounted = false
    }
  }, [isAndroidExpoGo])

  if (isAndroidExpoGo || !provider) {
    return children
  }

  const PushNotificationsProvider = provider
  return <PushNotificationsProvider>{children}</PushNotificationsProvider>
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedRootLayout />
    </AppThemeProvider>
  )
}
