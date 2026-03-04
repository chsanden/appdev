import { createClient } from '@supabase/supabase-js';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import Constants from "expo-constants"
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    console.debug("getItem", { key, getItemAsync })
    return getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (value.length > 2048) {
      console.warn('Value being stored in SecureStore is larger than 2048 bytes and it may not be stored successfully. In a future SDK version, this call may throw an error.')
    }
    return setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return deleteItemAsync(key)
  },
};

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra) as {
  supabaseUrl?: string;
  supabaseKey?: string;
};

const supabaseUrl = extra?.supabaseUrl
const supabaseAnonKey = extra?.supabaseKey

if(!supabaseUrl || !supabaseAnonKey){
  throw new Error("Cannot read env variables")
}

const storage = (
  Platform.OS === "web"
    ? window.localStorage
    : ExpoSecureStoreAdapter
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