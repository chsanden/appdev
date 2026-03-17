import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from "expo-constants"
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const extra = (Constants.expoConfig?.extra ?? Constants.expoConfig?.extra) as {
  supabaseUrl?: string
  supabaseKey?: string
}

const supabaseUrl = extra?.supabaseUrl
const supabaseAnonKey = extra?.supabaseKey

if(!supabaseUrl || !supabaseAnonKey){
  throw new Error("Cannot read env variables")
}

const storage = (
  Platform.OS === "web"
    ? window.localStorage
    : AsyncStorage
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
      storage: storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
