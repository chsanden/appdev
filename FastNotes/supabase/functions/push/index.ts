import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? ""

type NoteRecord = {
  id: number | string
  created_by: string
  title: string
}

type DatabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record?: NoteRecord | null
  old_record?: NoteRecord | null
}

type ExpoPushMessage = {
  to: string
  title: string
  body: string
  sound: "default"
  data: {
    type: "new-note"
    noteId: string
    title: string
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function chunkMessages<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function loadCreatorEmail(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.email) {
    return profile.email as string
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error) {
    console.error("Failed to load note creator:", error.message)
    return "unknown user"
  }

  return data.user.email ?? "unknown user"
}

async function loadRecipientTokens(userId: string) {
  const { data, error } = await supabase
    .from("user_push_tokens")
    .select("push_token")
    .neq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    throw new Error(error.message)
  }

  return Array.from(new Set((data ?? []).map((row) => row.push_token as string).filter(Boolean)))
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${EXPO_ACCESS_TOKEN}`
  }

  for (const chunk of chunkMessages(messages, 100)) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(chunk),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Expo push request failed with ${response.status}: ${errorBody}`)
    }
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "Missing Supabase environment variables." })
  }

  let payload: DatabaseWebhookPayload

  try {
    payload = await request.json()
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." })
  }

  if (payload.type !== "INSERT" || payload.table !== "Notes" || !payload.record) {
    return jsonResponse(200, { ignored: true })
  }

  try {
    const note = payload.record
    const [creatorEmail, recipientTokens] = await Promise.all([
      loadCreatorEmail(note.created_by),
      loadRecipientTokens(note.created_by),
    ])

    if (recipientTokens.length === 0) {
      return jsonResponse(200, { sent: 0 })
    }

    const body = `New note: "${note.title}" by ${creatorEmail}`
    const messages: ExpoPushMessage[] = recipientTokens.map((token) => ({
      to: token,
      title: "FastNotes",
      body,
      sound: "default",
      data: {
        type: "new-note",
        noteId: String(note.id),
        title: note.title,
      },
    }))

    await sendExpoPushNotifications(messages)

    return jsonResponse(200, { sent: messages.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error."
    console.error("Push notification webhook failed:", message)
    return jsonResponse(500, { error: message })
  }
})
