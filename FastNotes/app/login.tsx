import { useState } from 'react'
import { Link, Stack } from 'expo-router'
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '@/libs/supabase'
import { useAppTheme } from '@/src/theme/AppThemeProvider'
import { loginScreenStyles as styles } from '@/src/styles/app-styles'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { colorScheme, palette } = useAppTheme()

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Log in with email and password')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message)
    }

    setIsSubmitting(false)
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <KeyboardAvoidingView
        style={[styles.keyboardAvoider, { backgroundColor: palette.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss}>
            <View style={styles.form}>
              <Text style={[styles.title, { color: palette.text }]}>Login</Text>

              <Text style={[styles.label, { color: palette.text }]}>E-mail</Text>
              <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="name@email.com"
                  placeholderTextColor={palette.mutedText}
                  style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                  value={email}
              />

              <Text style={[styles.label, { color: palette.text }]}>Password</Text>
              <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={palette.mutedText}
                  secureTextEntry
                  style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                  value={password}
              />

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <Pressable
                disabled={isSubmitting}
                onPress={onLogin}
                  style={({ pressed }) => [
                      styles.loginButton,
                      pressed && !isSubmitting ? styles.loginButtonPressed : null,
                      isSubmitting ? styles.loginButtonDisabled : null,
                ]}
              >
                <Text style={styles.loginButtonText}>
                  {isSubmitting ? 'Logging in...' : 'Log in'}
                </Text>
              </Pressable>

              <Link href="/signup" style={styles.link}>
                <Text style={[styles.linkText, { color: colorScheme === "dark" ? "#8ab4ff" : "#0b57d0" }]}>Create a new account</Text>
              </Link>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}
