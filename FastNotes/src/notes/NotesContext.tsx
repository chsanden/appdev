import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { useAuthContext } from "@/hooks/use-auth-context"
import { supabase } from "@/libs/supabase"
import { deleteNoteImage, NoteImageUploadProgress, uploadNoteImage } from "@/src/notes/note-image-storage"
import { StagedNoteImage } from "@/src/notes/image-utils"

type NoteRow = {
    id: number
    created_by: string
    title: string
    content: string
    created_at: string
    updated_at?: string | null
    image_url?: string | null
    image_path?: string | null
    image_mime_type?: string | null
    image_size_bytes?: number | null
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
    imageUrl: string | null
    imagePath: string | null
    imageMimeType: string | null
    imageSizeBytes: number | null
}

export type NoteImageChange =
    | { type: "keep" }
    | { type: "remove" }
    | { type: "replace"; image: StagedNoteImage }

type NotesContextValue = {
    notes: Note[]
    isLoading: boolean
    errorMessage: string | null
    refreshNotes: () => Promise<void>
    fetchNoteById: (noteId: string) => Promise<Note | null>
    addNote: (
        title: string,
        content: string,
        image?: StagedNoteImage | null,
        options?: { onImageUploadProgress?: (progress: NoteImageUploadProgress) => void }
    ) => Promise<boolean>
    updateNote: (
        noteId: string,
        title: string,
        content: string,
        imageChange?: NoteImageChange,
        options?: { onImageUploadProgress?: (progress: NoteImageUploadProgress) => void }
    ) => Promise<boolean>
    deleteNote: (noteId: string) => Promise<boolean>
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined)

function normalizeImageSizeBytes(value: number | string | null | undefined) {
    if (typeof value === "number") {
        return value
    }

    if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}

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

    const buildCreatorLabels = useCallback(async (rows: NoteRow[]) => {
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
    }, [])

    const mapNoteRow = useCallback((row: NoteRow, labels: Record<string, string>) => ({
        id: String(row.id),
        createdBy: row.created_by,
        createdAt: row.created_at,
        lastChangedAt: row.updated_at || row.created_at,
        title: row.title,
        content: row.content,
        creatorLabel:
            labels[row.created_by] ||
            (row.created_by === userId ? creatorLabel : "Unknown user"),
        imageUrl: row.image_url ?? null,
        imagePath: row.image_path ?? null,
        imageMimeType: row.image_mime_type ?? null,
        imageSizeBytes: normalizeImageSizeBytes(row.image_size_bytes),
    }), [creatorLabel, userId])

    const loadNotes = useCallback(async () => {
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
            .select(
                "id, created_by, title, content, created_at, updated_at, image_url, image_path, image_mime_type, image_size_bytes"
            )
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })

        if (error) {
            setErrorMessage(error.message)
            setNotes([])
            setIsLoading(false)
            return
        }

        const rows = (data ?? []) as NoteRow[]
        const labels = await buildCreatorLabels(rows)

        setNotes(
            rows.map((row) => mapNoteRow(row, labels))
        )
        setIsLoading(false)
    }, [buildCreatorLabels, isLoggedIn, mapNoteRow])

    const refreshNotes = async () => {
        await loadNotes()
    }

    const fetchNoteById = useCallback(async (noteId: string) => {
        if (!isLoggedIn || !noteId) {
            return null
        }

        setErrorMessage(null)

        const { data, error } = await supabase
            .from("Notes")
            .select(
                "id, created_by, title, content, created_at, updated_at, image_url, image_path, image_mime_type, image_size_bytes"
            )
            .eq("id", Number(noteId))
            .maybeSingle()

        if (error) {
            setErrorMessage(error.message)
            return null
        }

        if (!data) {
            return null
        }

        const row = data as NoteRow
        const labels = await buildCreatorLabels([row])
        const fetchedNote = mapNoteRow(row, labels)

        setNotes((prev) => {
            const nextNotes = prev.filter((existingNote) => existingNote.id !== fetchedNote.id)
            return [fetchedNote, ...nextNotes]
        })

        return fetchedNote
    }, [buildCreatorLabels, isLoggedIn, mapNoteRow])

    useEffect(() => {
        if (!isLoggedIn || !userId) {
            setNotes([])
            setErrorMessage(null)
            setIsLoading(false)
            return
        }

        void loadNotes()
    }, [creatorLabel, isLoggedIn, loadNotes, userId])

    useEffect(() => {
        if (!isLoggedIn || !userId) {
            return
        }

        const intervalId = setInterval(() => {
            void loadNotes()
        }, 30000)

        return () => {
            clearInterval(intervalId)
        }
    }, [creatorLabel, isLoggedIn, loadNotes, userId])

    const addNote = async (
        title: string,
        content: string,
        image?: StagedNoteImage | null,
        options?: { onImageUploadProgress?: (progress: NoteImageUploadProgress) => void }
    ) => {
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

        let uploadedImage:
            | {
                path: string
                publicUrl: string
                mimeType: string
                sizeBytes: number
            }
            | null = null

        try {
            if (image) {
                uploadedImage = await uploadNoteImage(userId, image, {
                    onProgress: options?.onImageUploadProgress,
                })
            }

            const { error } = await supabase
                .from("Notes")
                .insert({
                    title: trimmedTitle,
                    content: trimmedContent,
                    image_url: uploadedImage?.publicUrl ?? null,
                    image_path: uploadedImage?.path ?? null,
                    image_mime_type: uploadedImage?.mimeType ?? null,
                    image_size_bytes: uploadedImage?.sizeBytes ?? null,
                })

            if (error) {
                throw new Error(error.message)
            }
        } catch (error) {
            if (uploadedImage?.path) {
                try {
                    await deleteNoteImage(uploadedImage.path)
                } catch (cleanupError) {
                    console.error("Failed to roll back uploaded note image:", cleanupError)
                }
            }

            setErrorMessage(error instanceof Error ? error.message : "Failed to save note.")
            return false
        }

        await refreshNotes()
        return true
    }

    const updateNote = async (
        noteId: string,
        title: string,
        content: string,
        imageChange: NoteImageChange = { type: "keep" },
        options?: { onImageUploadProgress?: (progress: NoteImageUploadProgress) => void }
    ) => {
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

        const existingNote = notes.find((note) => note.id === noteId)

        if (!existingNote) {
            setErrorMessage("This note could not be found.")
            return false
        }

        setErrorMessage(null)

        let uploadedImage:
            | {
                path: string
                publicUrl: string
                mimeType: string
                sizeBytes: number
            }
            | null = null

        const updates: Record<string, string | number | null> = {
            title: trimmedTitle,
            content: trimmedContent,
            updated_at: new Date().toISOString(),
        }

        try {
            if (imageChange.type === "replace") {
                uploadedImage = await uploadNoteImage(userId, imageChange.image, {
                    onProgress: options?.onImageUploadProgress,
                })
                updates.image_url = uploadedImage.publicUrl
                updates.image_path = uploadedImage.path
                updates.image_mime_type = uploadedImage.mimeType
                updates.image_size_bytes = uploadedImage.sizeBytes
            } else if (imageChange.type === "remove") {
                updates.image_url = null
                updates.image_path = null
                updates.image_mime_type = null
                updates.image_size_bytes = null
            }

            const { data, error } = await supabase
                .from("Notes")
                .update(updates)
                .eq("id", Number(noteId))
                .eq("created_by", userId)
                .select(
                    "id, title, content, updated_at, image_url, image_path, image_mime_type, image_size_bytes"
                )
                .maybeSingle()

            if (error) {
                throw new Error(error.message)
            }

            if (!data) {
                throw new Error("Update failed. You can only edit notes that you created.")
            }

            if (imageChange.type === "replace" && existingNote.imagePath) {
                try {
                    await deleteNoteImage(existingNote.imagePath)
                } catch (cleanupError) {
                    console.error("Failed to remove replaced note image:", cleanupError)
                }
            }

            if (imageChange.type === "remove" && existingNote.imagePath) {
                try {
                    await deleteNoteImage(existingNote.imagePath)
                } catch (cleanupError) {
                    console.error("Failed to remove deleted note image:", cleanupError)
                }
            }

            setNotes((prev) =>
                prev.map((note) =>
                    note.id === noteId
                        ? {
                            ...note,
                            title: data.title ?? trimmedTitle,
                            content: data.content ?? trimmedContent,
                            lastChangedAt: data.updated_at ?? updates.updated_at ?? new Date().toISOString(),
                            imageUrl: data.image_url ?? null,
                            imagePath: data.image_path ?? null,
                            imageMimeType: data.image_mime_type ?? null,
                            imageSizeBytes: normalizeImageSizeBytes(data.image_size_bytes),
                        }
                        : note
                )
            )
            return true
        } catch (error) {
            if (uploadedImage?.path) {
                try {
                    await deleteNoteImage(uploadedImage.path)
                } catch (cleanupError) {
                    console.error("Failed to roll back uploaded replacement image:", cleanupError)
                }
            }

            setErrorMessage(error instanceof Error ? error.message : "Failed to update note.")
            return false
        }
    }

    const deleteNote = async (noteId: string) => {
        if (!userId) {
            setErrorMessage("You must be logged in to delete notes.")
            return false
        }

        const existingNote = notes.find((note) => note.id === noteId)

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

        if (existingNote?.imagePath) {
            try {
                await deleteNoteImage(existingNote.imagePath)
            } catch (cleanupError) {
                console.error("Failed to remove note image during deletion:", cleanupError)
                setErrorMessage("The note was deleted, but its stored image could not be cleaned up.")
            }
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
                fetchNoteById,
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
