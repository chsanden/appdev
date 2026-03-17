import { useRef, useState } from "react"
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native"
import { router } from "expo-router"
import { BlurView } from "expo-blur"
import { useHeaderHeight } from "@react-navigation/elements"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import NoteImagePanel from "@/components/note-image-panel"
import UploadProgressBar from "@/components/upload-progress-bar"
import { useNotes } from "@/src/notes/NotesContext"
import { StagedNoteImage, validateStagedNoteImage } from "@/src/notes/image-utils"
import { newNoteScreenStyles as styles } from "@/src/styles/app-styles"
import { pickImageFromCamera, pickImageFromLibrary } from "@/src/notes/native-image-picker"
import { useAppTheme } from "@/src/theme/AppThemeProvider"

export default function NewNoteScreen() {
    const { addNote, errorMessage } = useNotes()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [stagedImage, setStagedImage] = useState<StagedNoteImage | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null)
    const insets = useSafeAreaInsets()
    const headerHeight = useHeaderHeight()
    const { colorScheme, palette } = useAppTheme()
    const [contentHeight, setContentHeight] = useState(160)
    const scrollRef = useRef<ScrollView>(null)

    const attachFromCamera = async () => {
        try {
            const image = await pickImageFromCamera()

            if (image) {
                validateStagedNoteImage(image)
                setStagedImage(image)
                setLocalErrorMessage(null)
            }
        } catch (error) {
            setLocalErrorMessage(error instanceof Error ? error.message : "The camera could not be opened.")
        }
    }

    const attachFromGallery = async () => {
        try {
            const image = await pickImageFromLibrary()

            if (image) {
                validateStagedNoteImage(image)
                setStagedImage(image)
                setLocalErrorMessage(null)
            }
        } catch (error) {
            setLocalErrorMessage(error instanceof Error ? error.message : "The gallery could not be opened.")
        }
    }

    const onSave = async () => {
        if (!title.trim() || !content.trim()) {
            setLocalErrorMessage("Title and content are required.")
            return
        }

        setIsSaving(true)
        setUploadProgress(null)
        setLocalErrorMessage(null)

        const wasSaved = await addNote(title, content, stagedImage, {
            onImageUploadProgress: (progress) => {
                setUploadProgress(progress.progress)
            },
        })

        setIsSaving(false)
        setUploadProgress(null)

        if (wasSaved) {
            if (router.canGoBack()) {
                router.back()
                return
            }

            router.replace("/")
        }
    }

    const saveDisabled = isSaving
    const imageActionsDisabled = isSaving
    const saveButtonStyle = saveDisabled ? styles.disabledButton : styles.enabledButtonShadow

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={headerHeight}
        >
            <View style={[styles.container, { backgroundColor: palette.background }]}>
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 112 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Give it a title..."
                        style={[
                            styles.titleInput,
                            { color: palette.text, borderColor: palette.border, backgroundColor: palette.input },
                        ]}
                        placeholderTextColor={palette.mutedText}
                        returnKeyType="next"
                    />

                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="Write your note..."
                        style={[
                            styles.contentInput,
                            {
                                minHeight: Math.max(200, contentHeight),
                                color: palette.text,
                                borderColor: palette.border,
                                backgroundColor: palette.input,
                            },
                        ]}
                        multiline
                        placeholderTextColor={palette.mutedText}
                        textAlignVertical="top"
                        onContentSizeChange={(e) => {
                            setContentHeight(e.nativeEvent.contentSize.height)
                            scrollRef.current?.scrollToEnd({ animated: true })
                        }}
                    />

                    <NoteImagePanel
                        canEdit
                        isBusy={imageActionsDisabled}
                        stagedImage={stagedImage}
                        helperText="Images upload when you save the note. Allowed formats: PNG, JPG, WEBP. Max 15 MB after compression."
                        palette={palette}
                        primaryTextColor={colorScheme === "dark" ? "#000" : "#fff"}
                        onTakePhoto={() => {
                            void attachFromCamera()
                        }}
                        onChooseFromLibrary={() => {
                            void attachFromGallery()
                        }}
                        onRemoveImage={() => {
                            setStagedImage(null)
                            setLocalErrorMessage(null)
                        }}
                    />

                    {uploadProgress !== null ? <UploadProgressBar progress={uploadProgress} palette={palette} /> : null}

                    {localErrorMessage ? (
                        <Text style={styles.errorText}>{localErrorMessage}</Text>
                    ) : null}

                    {!localErrorMessage && errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}
                </ScrollView>
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
                            style={[styles.saveButton, saveButtonStyle, { backgroundColor: palette.accent }]}
                        >
                            <Text style={[styles.saveFloatingText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>
                                {isSaving ? "Saving..." : "Save note"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}
