import { supabase } from "@/libs/supabase";
import { Link, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function SignupScreen(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSignup = async () => {
        if(!email.trim() || !password){
            setErrorMessage('Sign up using email and password')
            return
        }

        setIsSubmitting(true)
        setErrorMessage(null)
        setSuccessMessage(null)

        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password
        })

        if(error){
            setErrorMessage(error.message)
        } else if (data.session) {
            const user = data.user

            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email ?? email.trim(),
                    })

                if (profileError) {
                    setErrorMessage(profileError.message)
                }
            }
        }

        if (!error && data.session) {
            setSuccessMessage('Account created. You are now signed in.')
        } else if (!error) {
            setSuccessMessage('Account created. Check your email to confirm the signup.')
        }

        setIsSubmitting(false)
    }

    return (
    <>
    <Stack.Screen options={{title: "Signup"}}/>
    <View style={styles.container}>
        <Text style={styles.title}>Sign up</Text>

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

        <Text style={styles.label} >Password</Text>
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

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={onSignup}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && !isSubmitting ? styles.actionButtonPressed : null,
            isSubmitting ? styles.actionButtonDisabled : null,
          ]}
        >
          <Text style={styles.actionButtonText}>
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </Text>
        </Pressable>

        <Link href="/login" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
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
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111',
    marginTop: 8,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
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
