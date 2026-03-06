import { useAuthContext } from '@/hooks/use-auth-context'
import AuthProvider from '@/providers/auth-provider'
import { NotesProvider } from "@/src/notes/NotesContext"
import { AppThemeProvider, useAppTheme } from '@/src/theme/AppThemeProvider'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
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
          <NotesProvider>
            <RootNavigator />
          </NotesProvider>
        </AuthProvider>
        <StatusBar
          style={colorScheme === "dark" ? "light" : "dark"}
          backgroundColor={palette.statusBar}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedRootLayout />
    </AppThemeProvider>
  )
}
