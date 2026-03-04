import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuthContext } from "@/hooks/use-auth-context"
import { supabase } from "@/libs/supabase"

type NoteRow = {
    id: number
    created_by: string
    title: string
    content: string
    created_at: string
    updated_at?: string | null
}

type ProfileRow = {
    id: string
    full_name?: string | null
    username?: string | null
    email?: string | null
}

export type Note = {
    id: string
    createdBy: string
    createdAt: string
    lastChangedAt: string
    title: string
    content: string
    creatorLabel: string
}

type NotesContextValue = {
    notes: Note[]
    isLoading: boolean
    errorMessage: string | null
    refreshNotes: () => Promise<void>
    addNote: (title: string, content: string) => Promise<boolean>
    updateNote: (noteId: string, title: string, content: string) => Promise<boolean>
    deleteNote: (noteId: string) => Promise<boolean>
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined)

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const { claims, isLoggedIn, profile } = useAuthContext()
    const [notes, setNotes] = useState<Note[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const userId = claims?.sub as string | undefined
    const creatorLabel =
        profile?.full_name ||
        profile?.username ||
        claims?.email ||
        userId ||
        "Unknown user"

    const buildCreatorLabels = async (rows: NoteRow[]) => {
        const creatorIds = Array.from(new Set(rows.map((row) => row.created_by)))

        if (creatorIds.length === 0) {
            return {} as Record<string, string>
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, username, email")
            .in("id", creatorIds)

        if (error || !data) {
            return {} as Record<string, string>
        }

        return (data as ProfileRow[]).reduce<Record<string, string>>((acc, row) => {
            acc[row.id] =
                row.full_name ||
                row.username ||
                row.email ||
                "Unknown user"

            return acc
        }, {})
    }

    const mapNote = (row: NoteRow, labels: Record<string, string>): Note => ({
        id: String(row.id),
        createdBy: row.created_by,
        createdAt: row.created_at,
        lastChangedAt: row.updated_at || row.created_at,
        title: row.title,
        content: row.content,
        creatorLabel:
            labels[row.created_by] ||
            (row.created_by === userId ? creatorLabel : "Unknown user"),
    })

    const loadNotes = async () => {
        if (!isLoggedIn) {
            setNotes([])
            setErrorMessage(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        const { data, error } = await supabase
            .from("Notes")
            .select("id, created_by, title, content, created_at, updated_at")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })

        if (error) {
            setErrorMessage(error.message)
            setNotes([])
            setIsLoading(false)
            return
        }

        const rows = (data ?? []) as NoteRow[]
        // Resolve public creator labels separately so note reads do not depend on a view schema.
        const labels = await buildCreatorLabels(rows)

        setNotes(rows.map((row) => mapNote(row, labels)))
        setIsLoading(false)
    }

    const refreshNotes = async () => {
        await loadNotes()
    }

    useEffect(() => {
        if (!isLoggedIn || !userId) {
            setNotes([])
            setErrorMessage(null)
            setIsLoading(false)
            return
        }

        void loadNotes()
    }, [creatorLabel, isLoggedIn, userId])

    useEffect(() => {
        if (!isLoggedIn || !userId) {
            return
        }

        // Poll for remote changes so other users' edits appear without a manual refresh.
        const intervalId = setInterval(() => {
            void loadNotes()
        }, 60000)

        return () => {
            clearInterval(intervalId)
        }
    }, [creatorLabel, isLoggedIn, userId])

    const addNote = async (title: string, content: string) => {
        const trimmedTitle = title.trim()
        const trimmedContent = content.trim()

        if (!trimmedTitle || !trimmedContent) {
            setErrorMessage("Title and content are required.")
            return false
        }

        if (!userId) {
            setErrorMessage("You must be logged in to save notes.")
            return false
        }

        setErrorMessage(null)
        
        const { error } = await supabase
            .from("Notes")
            .insert({
                title: trimmedTitle,
                content: trimmedContent,
            })

        if (error) {
            setErrorMessage(error.message)
            return false
        }

        await refreshNotes()
        return true
    }

    const updateNote = async (noteId: string, title: string, content: string) => {
        const trimmedTitle = title.trim()
        const trimmedContent = content.trim()

        if (!trimmedTitle || !trimmedContent) {
            setErrorMessage("Title and content are required.")
            return false
        }

        if (!userId) {
            setErrorMessage("You must be logged in to update notes.")
            return false
        }

        setErrorMessage(null)

        const { data, error } = await supabase
            .from("Notes")
            .update({
                title: trimmedTitle,
                content: trimmedContent,
                updated_at: new Date().toISOString(),
            })
            .eq("id", Number(noteId))
            .eq("created_by", userId)
            .select("id, title, content, updated_at")
            .maybeSingle()

        if (error) {
            setErrorMessage(error.message)
            return false
        }

        if (!data) {
            setErrorMessage("Update failed. You can only edit notes that you created.")
            return false
        }

        // Update the edited note locally so the new timestamp is visible immediately.
        setNotes((prev) =>
            prev.map((note) =>
                note.id === noteId
                    ? {
                        ...note,
                        title: data.title ?? trimmedTitle,
                        content: data.content ?? trimmedContent,
                        lastChangedAt: data.updated_at ?? new Date().toISOString(),
                    }
                    : note
            )
        )
        return true
    }

    const deleteNote = async (noteId: string) => {
        if (!userId) {
            setErrorMessage("You must be logged in to delete notes.")
            return false
        }

        setErrorMessage(null)

        const { error } = await supabase
            .from("Notes")
            .delete()
            .eq("id", Number(noteId))
            .eq("created_by", userId)

        if (error) {
            setErrorMessage(error.message)
            return false
        }

        setNotes((prev) => prev.filter((note) => note.id !== noteId))
        return true
    }

    return (
        <NotesContext.Provider
            value={{
                notes,
                isLoading,
                errorMessage,
                refreshNotes,
                addNote,
                updateNote,
                deleteNote,
            }}
        >
            {children}
        </NotesContext.Provider>
    )
}

export function useNotes() {
    const ctx = useContext(NotesContext)
    if (!ctx) {
        throw new Error("useNotes must be used inside NotesProvider")
    }

    return ctx
}
