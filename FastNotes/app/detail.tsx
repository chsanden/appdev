import { useEffect, useState } from "react"
import {
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { BlurView } from "expo-blur"
import { useHeaderHeight } from "@react-navigation/elements"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import NoteImagePanel from "@/components/note-image-panel"
import UploadProgressBar from "@/components/upload-progress-bar"
import { useAuthContext } from "@/hooks/use-auth-context"
import { NoteImageChange, useNotes } from "@/src/notes/NotesContext"
import { StagedNoteImage, validateStagedNoteImage } from "@/src/notes/image-utils"
import { pickImageFromCamera, pickImageFromLibrary } from "@/src/notes/native-image-picker"
import { usePickerLifecycleGuard } from "@/src/notes/use-picker-lifecycle-guard"
import { detailScreenStyles as styles } from "@/src/styles/app-styles"
import { useAppTheme } from "@/src/theme/AppThemeProvider"

export default function DetailScreen() {
    const { id } = useLocalSearchParams<{
        id?: string
    }>()
    const { claims } = useAuthContext()
    const { deleteNote, errorMessage, fetchNoteById, notes, updateNote } = useNotes()
    const note = notes.find((entry) => entry.id === id)
    const canEdit = note?.createdBy === claims?.sub
    const [title, setTitle] = useState(note?.title ?? "")
    const [content, setContent] = useState(note?.content ?? "")
    const [stagedImage, setStagedImage] = useState<StagedNoteImage | null>(null)
    const [imageChange, setImageChange] = useState<NoteImageChange>({ type: "keep" })
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isLoadingNote, setIsLoadingNote] = useState(false)
    const insets = useSafeAreaInsets()
    const headerHeight = useHeaderHeight()
    const { colorScheme, palette } = useAppTheme()
    const { endPicker, isScreenActive, tryBeginPicker } = usePickerLifecycleGuard()

    const formatTimestamp = (value: string) => {
        const parsed = new Date(value)

        if (Number.isNaN(parsed.getTime())) {
            return "Unknown"
        }

        return parsed.toLocaleString()
    }

    useEffect(() => {
        setTitle(note?.title ?? "")
        setContent(note?.content ?? "")
        setStagedImage(null)
        setImageChange({ type: "keep" })
    }, [note?.content, note?.id, note?.title])

    useEffect(() => {
        if (!id || note) {
            setIsLoadingNote(false)
            return
        }

        let isMounted = true

        setIsLoadingNote(true)

        void fetchNoteById(id).finally(() => {
            if (isMounted) {
                setIsLoadingNote(false)
            }
        })

        return () => {
            isMounted = false
        }
    }, [fetchNoteById, id, note])

    const attachFromCamera = async () => {
        if (!tryBeginPicker()) {
            return
        }

        try {
            const image = await pickImageFromCamera()

            if (image && isScreenActive()) {
                validateStagedNoteImage(image)
                setStagedImage(image)
                setImageChange({ type: "replace", image })
                setLocalErrorMessage(null)
                setStatusMessage(null)
            }
        } catch (error) {
            if (isScreenActive()) {
                setLocalErrorMessage(error instanceof Error ? error.message : "The camera could not be opened.")
            }
        } finally {
            endPicker()
        }
    }

    const attachFromGallery = async () => {
        if (!tryBeginPicker()) {
            return
        }

        try {
            const image = await pickImageFromLibrary()

            if (image && isScreenActive()) {
                validateStagedNoteImage(image)
                setStagedImage(image)
                setImageChange({ type: "replace", image })
                setLocalErrorMessage(null)
                setStatusMessage(null)
            }
        } catch (error) {
            if (isScreenActive()) {
                setLocalErrorMessage(error instanceof Error ? error.message : "The gallery could not be opened.")
            }
        } finally {
            endPicker()
        }
    }

    const clearImage = () => {
        setStagedImage(null)
        setStatusMessage(null)
        setLocalErrorMessage(null)
        setImageChange(note?.imageUrl ? { type: "remove" } : { type: "keep" })
    }

    const onSave = async () => {
        if (!id) {
            setLocalErrorMessage("This note could not be found.")
            return
        }

        if (!title.trim() || !content.trim()) {
            setLocalErrorMessage("Title and content are required.")
            return
        }

        setIsSaving(true)
        setUploadProgress(null)
        setLocalErrorMessage(null)
        setStatusMessage(null)

        const wasSaved = await updateNote(id, title, content, imageChange, {
            onImageUploadProgress: (progress) => {
                setUploadProgress(progress.progress)
            },
        })

        setIsSaving(false)
        setUploadProgress(null)

        if (wasSaved) {
            setStagedImage(null)
            setImageChange({ type: "keep" })
            setStatusMessage("Note updated.")
        }
    }

    const confirmDelete = () => {
        Alert.alert(
            "Delete note",
            "Are you sure you want to delete this note?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        void onDelete()
                    },
                },
            ]
        )
    }

    const onDelete = async () => {
        if (!id) {
            setLocalErrorMessage("This note could not be found.")
            return
        }

        setIsDeleting(true)
        setLocalErrorMessage(null)
        setStatusMessage(null)

        const wasDeleted = await deleteNote(id)

        setIsDeleting(false)

        if (wasDeleted) {
            router.replace("/")
        }
    }

    if (isLoadingNote && !note) {
        return (
            <View
                testID="note-detail-loader"
                style={[styles.container, { backgroundColor: palette.background, padding: 16, justifyContent: "center" }]}
            >
                <ActivityIndicator size="large" color={palette.accent} />
                <Text style={[styles.content, { color: palette.mutedText, marginTop: 12 }]}>Loading note...</Text>
            </View>
        )
    }

    if (!note) {
        return (
            <View style={[styles.container, { backgroundColor: palette.background, padding: 16 }]}>
                <Text style={[styles.title, { color: palette.text }]}>Note not found</Text>
                <Text style={[styles.content, { color: palette.mutedText }]}>The note may have been deleted.</Text>
            </View>
        )
    }

    const currentImageUrl = imageChange.type === "remove" ? null : note.imageUrl
    const currentImageMimeType = imageChange.type === "remove" ? null : note.imageMimeType
    const currentImageSizeBytes = imageChange.type === "remove" ? null : note.imageSizeBytes
    const isUploading = uploadProgress !== null
    const imageActionsDisabled = isSaving || isUploading
    const saveDisabled = isSaving
    const deleteDisabled = isDeleting || isUploading
    const primaryButtonStyle = saveDisabled ? styles.disabledButton : styles.enabledButtonShadow
    const deleteButtonStyle = deleteDisabled ? styles.disabledButton : styles.enabledButtonShadow

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={headerHeight}
            style={styles.keyboardAvoider}
        >
            <View style={[styles.container, { backgroundColor: palette.background }]}>
                <ScrollView
                    contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 112 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <TextInput
                        editable={canEdit}
                        onChangeText={setTitle}
                        style={[
                            styles.titleInput,
                            { color: palette.text, borderColor: palette.border, backgroundColor: palette.input },
                        ]}
                        value={title}
                        placeholderTextColor={palette.mutedText}
                    />
                    <Text style={[styles.signature, { color: palette.mutedText }]}>Created by {note.creatorLabel}</Text>
                    <Text style={[styles.signature, { color: palette.mutedText }]}>
                        Last changed {formatTimestamp(note.lastChangedAt)}
                    </Text>
                    <TextInput
                        editable={canEdit}
                        multiline
                        onChangeText={setContent}
                        style={[
                            styles.contentInput,
                            { color: palette.text, borderColor: palette.border, backgroundColor: palette.input },
                        ]}
                        textAlignVertical="top"
                        value={content}
                        placeholderTextColor={palette.mutedText}
                    />

                    <NoteImagePanel
                        canEdit={Boolean(canEdit)}
                        isBusy={imageActionsDisabled}
                        currentImageUrl={currentImageUrl}
                        currentImageMimeType={currentImageMimeType}
                        currentImageSizeBytes={currentImageSizeBytes}
                        stagedImage={stagedImage}
                        helperText={
                            canEdit
                                ? "Replacing or removing the image only takes effect after you save changes."
                                : "This image is attached to the note and stored in Supabase."
                        }
                        palette={palette}
                        primaryTextColor={colorScheme === "dark" ? "#000" : "#fff"}
                        onTakePhoto={() => {
                            void attachFromCamera()
                        }}
                        onChooseFromLibrary={() => {
                            void attachFromGallery()
                        }}
                        onRemoveImage={clearImage}
                    />

                    {uploadProgress !== null ? <UploadProgressBar progress={uploadProgress} palette={palette} /> : null}

                    {!canEdit ? (
                        <Text style={[styles.readOnlyText, { color: palette.mutedText }]}>
                            Only the creator of this note can update or delete it.
                        </Text>
                    ) : null}
                    {localErrorMessage ? <Text style={styles.errorText}>{localErrorMessage}</Text> : null}
                    {!localErrorMessage && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                    {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}
                </ScrollView>
                {canEdit ? (
                    <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
                        <BlurView
                            intensity={22}
                            tint={colorScheme}
                            style={styles.actionsBlur}
                        />
                        <View style={[styles.actionsContent, { borderColor: palette.border }]}>
                            <Pressable
                                disabled={saveDisabled}
                                onPress={() => {
                                    void onSave()
                                }}
                                style={[styles.primaryButton, primaryButtonStyle, { backgroundColor: palette.accent }]}
                            >
                                <Text style={[styles.primaryButtonText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Text>
                            </Pressable>
                            <Pressable
                                disabled={deleteDisabled}
                                onPress={confirmDelete}
                                style={[styles.deleteButton, deleteButtonStyle, { backgroundColor: palette.destructive }]}
                            >
                                <Text style={styles.deleteButtonText}>
                                    {isDeleting ? "Deleting..." : "Delete note"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                ) : null}
            </View>
        </KeyboardAvoidingView>
    )
}
