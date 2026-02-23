import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotesProvider } from "@/src/notes/NotesContext"
import { useColorScheme } from '@/hooks/use-color-scheme';
;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  /*TODO
  Sort ThemeProvider to work with dark theme on iOS
  */

  return (
    <SafeAreaProvider>
      <NotesProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DefaultTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'FastNotes' }} />
            <Stack.Screen name="newNote" options={{ title: 'New Note'}}/>
            <Stack.Screen name="detail" options={{ title: 'Detail'}}/>
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </NotesProvider>
    </SafeAreaProvider>
  );
}
