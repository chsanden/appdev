import { supabase, supabaseAnonKey, supabaseUrl } from "@/libs/supabase"
import {
    createStoragePath,
    NOTE_IMAGE_BUCKET,
    prepareNoteImage,
    StagedNoteImage,
    UploadedNoteImage,
} from "@/src/notes/image-utils"

export type NoteImageUploadProgress = {
    loaded: number
    total: number
    progress: number
}

type UploadNoteImageOptions = {
    onProgress?: (progress: NoteImageUploadProgress) => void
}

function normalizeUploadFailureMessage(error: unknown) {
    if (error instanceof Error) {
        if (
            error.message.startsWith("Unsupported image format.") ||
            error.message.startsWith("Image too large.")
        ) {
            return error.message
        }

        if (error.message.trim()) {
            if (error.message.startsWith("Image upload failed.")) {
                return error.message
            }

            return `Image upload failed. ${error.message}`
        }
    }

    return "Image upload failed. Check your connection and try again."
}

async function uploadWithProgress(
    path: string,
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: NoteImageUploadProgress) => void
) {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Image upload failed. Storage configuration is missing.")
    }

    const anonKey = supabaseAnonKey
    const storageBaseUrl = supabaseUrl
    const session = await supabase.auth.getSession()
    const accessToken = session.data.session?.access_token
    const uploadUrl = `${storageBaseUrl}/storage/v1/object/${NOTE_IMAGE_BUCKET}/${path}`

    const response = await fetch(fileUri)

    if (!response.ok) {
        throw new Error("The selected image could not be read.")
    }

    const fileBlob = await response.blob()

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.open("POST", uploadUrl)
        xhr.setRequestHeader("apikey", anonKey)
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken ?? anonKey}`)
        xhr.setRequestHeader("x-upsert", "false")
        xhr.setRequestHeader("cache-control", "3600")
        xhr.setRequestHeader("content-type", mimeType)

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable || !event.total) {
                return
            }

            onProgress?.({
                loaded: event.loaded,
                total: event.total,
                progress: Math.min(100, Math.round((event.loaded / event.total) * 100)),
            })
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress?.({
                    loaded: fileBlob.size,
                    total: fileBlob.size,
                    progress: 100,
                })
                resolve()
                return
            }

            try {
                const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string }
                reject(new Error(parsed.message || parsed.error || "Upload failed."))
            } catch {
                reject(new Error("Upload failed."))
            }
        }

        xhr.onerror = () => {
            reject(new Error("Check your connection and try again."))
        }

        xhr.onabort = () => {
            reject(new Error("Upload cancelled."))
        }

        onProgress?.({
            loaded: 0,
            total: fileBlob.size,
            progress: 0,
        })
        xhr.send(fileBlob)
    })
}

export async function uploadNoteImage(
    userId: string,
    image: StagedNoteImage,
    options: UploadNoteImageOptions = {}
): Promise<UploadedNoteImage> {
    const preparedImage = await prepareNoteImage(image)
    const path = createStoragePath(userId, preparedImage.mimeType)

    try {
        await uploadWithProgress(path, preparedImage.uri, preparedImage.mimeType, options.onProgress)
    } catch (error) {
        throw new Error(normalizeUploadFailureMessage(error))
    }

    const { data } = supabase.storage
        .from(NOTE_IMAGE_BUCKET)
        .getPublicUrl(path)

    return {
        path,
        publicUrl: data.publicUrl,
        mimeType: preparedImage.mimeType,
        sizeBytes: preparedImage.sizeBytes,
    }
}

export async function deleteNoteImage(path: string) {
    const { error } = await supabase.storage
        .from(NOTE_IMAGE_BUCKET)
        .remove([path])

    if (error) {
        throw new Error(error.message)
    }
}
