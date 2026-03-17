import { supabase } from "@/libs/supabase"
import { Link, Stack, router } from "expo-router"
import { useState } from "react"
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useAppTheme } from "@/src/theme/AppThemeProvider"
import { signupScreenStyles as styles } from "@/src/styles/app-styles"

export default function SignupScreen(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { colorScheme, palette } = useAppTheme()

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
    <KeyboardAvoidingView
        style={[styles.keyboardAvoider, { backgroundColor: palette.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
            <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss}>
                <View style={styles.form}>
                    <Pressable
                        onPress={() => router.replace("/login")}
                        style={styles.backButton}
                    >
                        <Text style={[styles.backButtonText, { color: palette.text }]}>Back to login</Text>
                    </Pressable>

                    <Text style={[styles.title, { color: palette.text }]}>Sign up</Text>

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

                    <Text style={[styles.label, { color: palette.text }]} >Password</Text>
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
                      <Text style={[styles.linkText, { color: colorScheme === "dark" ? "#8ab4ff" : "#0b57d0" }]}>Already have an account? Log in</Text>
                    </Link>
                </View>
            </Pressable>
        </ScrollView>
    </KeyboardAvoidingView>
    </>
    )
}
