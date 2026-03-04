import { useState } from 'react'
import { Link, Stack } from 'expo-router'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/libs/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="name@email.com"
            placeholderTextColor="#666"
            style={styles.input}
            value={email}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.input}
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
          <Text style={styles.linkText}>Create a new account</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111',
    marginTop: 8,
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    alignSelf: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#0b57d0',
    fontSize: 16,
  },
})
