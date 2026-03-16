import { PropsWithChildren, useEffect } from "react"
import * as Notifications from "expo-notifications"

import { useAuthContext } from "@/hooks/use-auth-context"
import { supabase } from "@/libs/supabase"
import { registerPushNotifications } from "@/src/notifications/push-notifications"

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
})

async function loadCreatorEmail(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle()

    if (error) {
        console.error("Failed to load note creator email:", error.message)
        return "unknown user"
    }

    return typeof data?.email === "string" && data.email.trim() ? data.email : "unknown user"
}

export default function PushNotificationsProvider({ children }: PropsWithChildren) {
    const { claims, isLoading, isLoggedIn } = useAuthContext()

    useEffect(() => {
        if (isLoading || !isLoggedIn || !claims?.sub) {
            return
        }

        let isCancelled = false
        let teardownRealtimeFallback: (() => void) | undefined

        const register = async () => {
            const result = await registerPushNotifications(claims.sub as string)

            if (isCancelled || result.status === "registered" || result.status === "denied" || result.status === "unsupported") {
                return
            }

            if (result.status === "local-only" || result.status === "missing-project-id" || result.status === "error") {
                const channel = supabase
                    .channel(`notes-local-notifications-${claims.sub}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "Notes",
                        },
                        async (payload) => {
                            const note = payload.new as { id?: string | number; title?: string; created_by?: string }

                            if (!note?.created_by || note.created_by === claims.sub) {
                                return
                            }

                            const creatorEmail = await loadCreatorEmail(note.created_by)

                            void Notifications.scheduleNotificationAsync({
                                content: {
                                    title: "FastNotes",
                                    body: `New note: "${note.title ?? "Untitled"}" by ${creatorEmail}`,
                                    data: {
                                        type: "new-note",
                                        noteId: note.id ? String(note.id) : "",
                                        title: note.title ?? "Untitled",
                                    },
                                },
                                trigger: null,
                            })
                        }
                    )
                    .subscribe()

                teardownRealtimeFallback = () => {
                    void supabase.removeChannel(channel)
                }
            }

            if (result.status === "missing-project-id" || result.status === "error") {
                console.error("Push notification setup failed:", result.message)
            }
        }

        void register()

        return () => {
            isCancelled = true
            teardownRealtimeFallback?.()
        }
    }, [claims?.sub, isLoading, isLoggedIn])

    return children
}
