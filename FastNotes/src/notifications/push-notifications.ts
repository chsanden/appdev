import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { supabase } from "@/libs/supabase"

const INSTALLATION_ID_STORAGE_KEY = "fastnotes.push.installation-id"
const PUSH_TOKEN_TABLE = "user_push_tokens"

type PushRegistrationResult =
    | { status: "unsupported" | "denied" | "registered" | "local-only" }
    | { status: "missing-project-id" | "error"; message: string }

function getEasProjectId() {
    return (
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.easProjectId ??
        Constants.expoConfig?.extra?.eas?.projectId ??
        null
    )
}

async function getInstallationId() {
    const existingInstallationId = await AsyncStorage.getItem(INSTALLATION_ID_STORAGE_KEY)

    if (existingInstallationId) {
        return existingInstallationId
    }

    const nextInstallationId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    await AsyncStorage.setItem(INSTALLATION_ID_STORAGE_KEY, nextInstallationId)
    return nextInstallationId
}

async function ensureAndroidChannel() {
    if (Platform.OS !== "android") {
        return
    }

    await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1f6feb",
    })
}

function isPhysicalDevice() {
    return Constants.isDevice ?? false
}

export async function registerPushNotifications(userId: string): Promise<PushRegistrationResult> {
    if (Platform.OS === "web") {
        return { status: "unsupported" }
    }

    try {
        await ensureAndroidChannel()

        const existingPermissions = await Notifications.getPermissionsAsync()
        let finalStatus = existingPermissions.status

        if (finalStatus !== "granted") {
            const requestedPermissions = await Notifications.requestPermissionsAsync()
            finalStatus = requestedPermissions.status
        }

        if (finalStatus !== "granted") {
            return { status: "denied" }
        }

        if (!isPhysicalDevice()) {
            return { status: "local-only" }
        }

        const projectId = getEasProjectId()

        if (!projectId) {
            return {
                status: "missing-project-id",
                message: "Missing Expo EAS project ID. Set EXPO_PUBLIC_EAS_PROJECT_ID before building the app.",
            }
        }

        const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId })
        const installationId = await getInstallationId()

        const { error } = await supabase.from(PUSH_TOKEN_TABLE).upsert(
            {
                installation_id: installationId,
                user_id: userId,
                push_token: expoPushToken.data,
                platform: Platform.OS,
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "installation_id",
            }
        )

        if (error) {
            return { status: "error", message: error.message }
        }

        return { status: "registered" }
    } catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Push notification registration failed.",
        }
    }
}

export async function unregisterPushNotifications(userId?: string) {
    if (Platform.OS === "web") {
        return true
    }

    try {
        const installationId = await getInstallationId()
        let query = supabase.from(PUSH_TOKEN_TABLE).delete().eq("installation_id", installationId)

        if (userId) {
            query = query.eq("user_id", userId)
        }

        const { error } = await query
        return !error
    } catch {
        return false
    }
}
