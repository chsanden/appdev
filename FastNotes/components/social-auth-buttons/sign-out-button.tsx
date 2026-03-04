import { supabase } from '@/libs/supabase'
import { router } from 'expo-router'
import React from 'react'
import { Button } from 'react-native'

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    return
  }

  router.replace('/login')
}

export default function SignOutButton() {
  return <Button title="Sign out" onPress={onSignOutButtonPress} />
}
