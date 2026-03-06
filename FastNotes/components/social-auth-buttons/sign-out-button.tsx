import { supabase } from '@/libs/supabase'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useAppTheme } from '@/src/theme/AppThemeProvider'

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    return
  }

  router.replace('/login')
}

export default function SignOutButton() {
  const { palette } = useAppTheme()

  return (
    <Pressable
      onPress={onSignOutButtonPress}
      style={[styles.button, { borderColor: palette.border, backgroundColor: palette.elevated }]}
    >
      <Text style={[styles.text, { color: palette.text }]}>Sign out</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
})
