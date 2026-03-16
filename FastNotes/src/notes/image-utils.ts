import * as ImageManipulator from "expo-image-manipulator"

export const NOTE_IMAGE_BUCKET = "note-images"
export const MAX_NOTE_IMAGE_BYTES = 15 * 1024 * 1024
export const SUPPORTED_NOTE_IMAGE_FORMATS = "PNG, JPG/JPEG, WEBP"

const JPEG_MIME = "image/jpeg"
const PNG_MIME = "image/png"
const WEBP_MIME = "image/webp"

export type SupportedMimeType =
    | typeof JPEG_MIME
    | typeof PNG_MIME
    | typeof WEBP_MIME

export type StagedNoteImage = {
    uri: string
    fileName: string
    mimeType: string | null
    fileSize: number | null
    width?: number | null
    height?: number | null
}

export type UploadedNoteImage = {
    path: string
    publicUrl: string
    mimeType: SupportedMimeType
    sizeBytes: number
}

export type PreparedNoteImage = {
    uri: string
    mimeType: SupportedMimeType
    sizeBytes: number
}

function normalizeFileExtension(fileName: string | null | undefined) {
    const extension = fileName?.split(".").pop()?.toLowerCase()

    if (!extension) {
        return null
    }

    if (extension === "jpg") {
        return "jpeg"
    }

    return extension
}

export function normalizeMimeType(
    mimeType: string | null | undefined,
    fileName?: string | null
): SupportedMimeType | null {
    if (mimeType === JPEG_MIME || mimeType === PNG_MIME || mimeType === WEBP_MIME) {
        return mimeType
    }

    if (mimeType === "image/jpg") {
        return JPEG_MIME
    }

    const extension = normalizeFileExtension(fileName)

    if (extension === "jpeg") {
        return JPEG_MIME
    }

    if (extension === "png") {
        return PNG_MIME
    }

    if (extension === "webp") {
        return WEBP_MIME
    }

    return null
}

function getFileExtension(mimeType: SupportedMimeType) {
    if (mimeType === PNG_MIME) {
        return "png"
    }

    if (mimeType === WEBP_MIME) {
        return "webp"
    }

    return "jpg"
}

function getSaveFormat(mimeType: SupportedMimeType) {
    if (mimeType === PNG_MIME) {
        return ImageManipulator.SaveFormat.PNG
    }

    if (mimeType === WEBP_MIME) {
        return ImageManipulator.SaveFormat.WEBP
    }

    return ImageManipulator.SaveFormat.JPEG
}

export function formatBytes(bytes: number | null | undefined) {
    if (!bytes || Number.isNaN(bytes) || bytes <= 0) {
        return "Unknown size"
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateStagedNoteImage(image: StagedNoteImage) {
    const normalizedMimeType = normalizeMimeType(image.mimeType, image.fileName)

    if (!normalizedMimeType) {
        throw new Error(`Unsupported image format. Allowed formats: ${SUPPORTED_NOTE_IMAGE_FORMATS}.`)
    }

    return normalizedMimeType
}

async function getFileSize(uri: string) {
    const response = await fetch(uri)
    const blob = await response.blob()
    return blob.size
}

export async function readUriAsArrayBuffer(uri: string) {
    const response = await fetch(uri)

    if (!response.ok) {
        throw new Error("The selected image could not be read.")
    }

    return response.arrayBuffer()
}

function buildActions(width: number, height: number) {
    const largestSide = Math.max(width, height)

    if (largestSide <= 1600) {
        return []
    }

    const scale = 1600 / largestSide

    return [
        {
            resize: {
                width: Math.max(1, Math.round(width * scale)),
                height: Math.max(1, Math.round(height * scale)),
            },
        },
    ]
}

export async function prepareNoteImage(image: StagedNoteImage): Promise<PreparedNoteImage> {
    const normalizedMimeType = validateStagedNoteImage(image)
    const targetMimeType = normalizedMimeType === PNG_MIME ? PNG_MIME : JPEG_MIME
    const saveFormat = getSaveFormat(targetMimeType)
    const actions =
        image.width && image.height
            ? buildActions(image.width, image.height)
            : []

    const compressions = targetMimeType === PNG_MIME ? [1] : [0.82, 0.7, 0.56, 0.42, 0.32]

    for (const compression of compressions) {
        const result = await ImageManipulator.manipulateAsync(image.uri, actions, {
            compress: compression,
            format: saveFormat,
        })
        const sizeBytes = await getFileSize(result.uri)

        if (sizeBytes <= MAX_NOTE_IMAGE_BYTES) {
            return {
                uri: result.uri,
                mimeType: targetMimeType,
                sizeBytes,
            }
        }
    }

    throw new Error("Image too large. The selected image is still larger than 15 MB after compression.")
}

export function createStoragePath(userId: string, mimeType: SupportedMimeType) {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    return `${userId}/${id}.${getFileExtension(mimeType)}`
}
