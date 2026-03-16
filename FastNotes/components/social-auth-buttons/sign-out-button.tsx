import { supabase } from '@/libs/supabase'
import { router } from 'expo-router'
import Constants from "expo-constants"
import React from 'react'
import { Platform, Pressable, Text } from 'react-native'
import { useAppTheme } from '@/src/theme/AppThemeProvider'
import { signOutButtonStyles as styles } from '@/src/styles/app-styles'

async function onSignOutButtonPress() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAndroidExpoGo = Platform.OS === "android" && Constants.executionEnvironment === "storeClient"

  if (user?.id && !isAndroidExpoGo) {
    const { unregisterPushNotifications } = await import('@/src/notifications/push-notifications')
    const removed = await unregisterPushNotifications(user.id)

    if (!removed) {
      console.error('Failed to unregister push notifications before sign out.')
    }
  }

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
