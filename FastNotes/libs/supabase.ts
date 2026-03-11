import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'
import 'react-native-url-polyfill/auto'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const REFRESH_TOKEN_STORAGE_KEY = 'supabase.auth.refresh-token'

type PersistedSession = {
  refresh_token?: string
}

const NativeSplitStorageAdapter = {
  getItem: async (key: string) => {
    return AsyncStorage.getItem(key)
  },

  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value)

    try {
      const session = JSON.parse(value) as PersistedSession

      if (session.refresh_token) {
        await setItemAsync(REFRESH_TOKEN_STORAGE_KEY, session.refresh_token)
      } else {
        await deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY)
      }
    } catch (error) {
      console.warn('Stored Supabase session, but could not parse refresh token for SecureStore backup.', error)
    }
  },

  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key)
    await deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY)
  },
}

export const hasSecureRefreshToken = async () => {
  if (Platform.OS === 'web') {
    return false
  }

  const refreshToken = await getItemAsync(REFRESH_TOKEN_STORAGE_KEY)
  return Boolean(refreshToken)
}

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra) as {
  supabaseUrl?: string
  supabaseKey?: string
}

const supabaseUrl = extra?.supabaseUrl
const supabaseAnonKey = extra?.supabaseKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Cannot read env variables')
}

const storage = Platform.OS === 'web' ? window.localStorage : NativeSplitStorageAdapter

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
