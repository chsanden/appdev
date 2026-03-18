// deno-lint-ignore no-import-prefix
import { createClient } from "npm:@supabase/supabase-js@2"

type NoteRecord = {
  id: number | string
  created_by: string
  title: string
}

type ProfileEmailRow = {
  email: string | null
}

type PushTokenRow = {
  push_token: string | null
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

type ExpoPushTicket = {
  status?: "ok" | "error"
  id?: string
  message?: string
  details?: {
    error?: string
  }
}

type ExpoPushResponse = {
  data?: ExpoPushTicket[]
}

type ExpoSendResult = {
  acceptedCount: number
  failedTickets: Array<{
    token: string
    error: string
  }>
  invalidTokens: string[]
}

type SupabaseAdminClient = ReturnType<typeof createClient>

let supabase: SupabaseAdminClient | null = null

function getOptionalEnv(name: string) {
  return Deno.env.get(name)?.trim() ?? ""
}

function requireEnv(name: string) {
  const value = getOptionalEnv(name)

  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }

  return value
}

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }

  return supabase
}

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

async function loadCreatorEmail(supabase: SupabaseAdminClient, userId: string): Promise<string> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("Failed to load note creator profile:", profileError.message)
  }

  const typedProfile = profile as ProfileEmailRow | null

  if (typedProfile?.email?.trim()) {
    return typedProfile.email
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error) {
    console.error("Failed to load note creator:", error.message)
    return "unknown user"
  }

  return data.user.email ?? "unknown user"
}

async function loadRecipientTokens(supabase: SupabaseAdminClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_push_tokens")
    .select("push_token")
    .neq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as PushTokenRow[]

  return Array.from(new Set(rows.map((row) => row.push_token).filter((token): token is string => Boolean(token))))
}

async function deactivatePushTokens(supabase: SupabaseAdminClient, tokens: string[]) {
  if (tokens.length === 0) {
    return
  }

  // deno-lint-ignore no-explicit-any
  const pushTokensTable = supabase.from("user_push_tokens") as any

  const { error } = await pushTokensTable
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .in("push_token", tokens)

  if (error) {
    console.error("Failed to deactivate invalid push tokens:", error.message)
  }
}

function parseExpoPushResponse(responseText: string): ExpoPushResponse {
  try {
    return JSON.parse(responseText) as ExpoPushResponse
  } catch {
    throw new Error("Expo push response was not valid JSON.")
  }
}

async function sendExpoPushNotifications(
  supabase: SupabaseAdminClient,
  messages: ExpoPushMessage[],
): Promise<ExpoSendResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  const invalidTokens = new Set<string>()
  const failedTickets: ExpoSendResult["failedTickets"] = []
  let acceptedCount = 0
  const expoAccessToken = getOptionalEnv("EXPO_ACCESS_TOKEN")

  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`
  }

  for (const chunk of chunkMessages(messages, 100)) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(chunk),
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`Expo push request failed with ${response.status}: ${responseText}`)
    }

    const responseBody = parseExpoPushResponse(responseText)
    const tickets = Array.isArray(responseBody.data) ? responseBody.data : []

    if (tickets.length !== chunk.length) {
      throw new Error(`Expo push response size mismatch: expected ${chunk.length} tickets, got ${tickets.length}.`)
    }

    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index]
      const token = chunk[index].to

      if (ticket?.status === "ok") {
        acceptedCount += 1
        continue
      }

      const expoError = ticket?.details?.error
      const errorMessage = ticket?.message ?? "Unknown Expo push ticket error."
      failedTickets.push({
        token,
        error: expoError ? `${expoError}: ${errorMessage}` : errorMessage,
      })

      if (expoError === "DeviceNotRegistered") {
        invalidTokens.add(token)
      }
    }
  }

  const tokensToDeactivate = Array.from(invalidTokens)
  await deactivatePushTokens(supabase, tokensToDeactivate)

  return {
    acceptedCount,
    failedTickets,
    invalidTokens: tokensToDeactivate,
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" })
  }

  let payload: DatabaseWebhookPayload
  let supabase: SupabaseAdminClient

  try {
    supabase = getSupabaseClient()
    payload = await request.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error."

    if (message.startsWith("Missing required env var:")) {
      return jsonResponse(500, { error: message })
    }

    return jsonResponse(400, { error: "Invalid JSON payload." })
  }

  if (payload.type !== "INSERT" || payload.table !== "Notes" || !payload.record) {
    return jsonResponse(200, { ignored: true })
  }

  try {
    const note = payload.record
    const [creatorEmail, recipientTokens] = await Promise.all([
      loadCreatorEmail(supabase, note.created_by),
      loadRecipientTokens(supabase, note.created_by),
    ])

    if (recipientTokens.length === 0) {
      return jsonResponse(200, { sent: 0 })
    }

    const body = `New note: "${note.title}" by ${creatorEmail}`
    const messages: ExpoPushMessage[] = recipientTokens.map((token: string) => ({
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

    const sendResult = await sendExpoPushNotifications(supabase, messages)

    if (sendResult.failedTickets.length > 0) {
      console.error("Expo rejected one or more push messages:", sendResult.failedTickets)
    }

    return jsonResponse(200, {
      sent: sendResult.acceptedCount,
      failed: sendResult.failedTickets.length,
      deactivated: sendResult.invalidTokens.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error."
    console.error("Push notification webhook failed:", message)
    return jsonResponse(500, { error: message })
  }
})
