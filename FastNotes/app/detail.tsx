import { useEffect, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useHeaderHeight } from "@react-navigation/elements"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAppTheme } from "@/src/theme/AppThemeProvider"

import { useAuthContext } from "@/hooks/use-auth-context"
import { useNotes } from "@/src/notes/NotesContext"


export default function DetailScreen()
{
    const { id } = useLocalSearchParams<
    {
        id?: string
    }>()
    const { claims } = useAuthContext()
    const { deleteNote, errorMessage, notes, updateNote } = useNotes()
    const note = notes.find((entry) => entry.id === id)
    const canEdit = note?.createdBy === claims?.sub
    const [title, setTitle] = useState(note?.title ?? "")
    const [content, setContent] = useState(note?.content ?? "")
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const insets = useSafeAreaInsets()
    const headerHeight = useHeaderHeight()
    const { colorScheme, palette } = useAppTheme()

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
    }, [note?.content, note?.title])

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
        setLocalErrorMessage(null)
        setStatusMessage(null)

        const wasSaved = await updateNote(id, title, content)

        setIsSaving(false)

        if (wasSaved) {
            setStatusMessage("Note updated.")
        }
    }

    const confirmDelete = () => {
        // Require explicit confirmation before deleting the note.
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

    if (!note) {
        return (
            <View style={[styles.container, { backgroundColor: palette.background, padding: 16 }]}>
                <Text style={[styles.title, { color: palette.text }]}>Note not found</Text>
                <Text style={[styles.content, { color: palette.mutedText }]}>The note may have been deleted.</Text>
            </View>
        )
    }

    return(
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
                        style={[styles.titleInput, { color: palette.text, borderColor: palette.border, backgroundColor: palette.input }]}
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
                        style={[styles.contentInput, { color: palette.text, borderColor: palette.border, backgroundColor: palette.input }]}
                        textAlignVertical="top"
                        value={content}
                        placeholderTextColor={palette.mutedText}
                    />
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
                    <View style={[styles.actions, { bottom: insets.bottom + 16 }]}>
                        <Pressable disabled={isSaving} onPress={onSave} style={[styles.primaryButton, { backgroundColor: palette.accent }]}>
                            <Text style={[styles.primaryButtonText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>
                                {isSaving ? "Saving..." : "Save changes"}
                            </Text>
                        </Pressable>
                        <Pressable disabled={isDeleting} onPress={confirmDelete} style={[styles.deleteButton, { backgroundColor: palette.destructive }]}>
                            <Text style={styles.deleteButtonText}>
                                {isDeleting ? "Deleting..." : "Delete note"}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>
        </KeyboardAvoidingView>
    )
}


const styles = StyleSheet.create(
    {
        keyboardAvoider: { flex: 1 },
        container: { flex: 1 },
        formContent: { padding: 16, gap: 12 },
        title: { fontSize: 22, fontWeight:"700" },
        content: { fontSize: 16 },
        titleInput: {
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            fontSize: 22,
            fontWeight: "700",
        },
        signature: {
            fontSize: 12,
            color: "#666",
        },
        contentInput: {
            minHeight: 200,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
        },
        errorText: {
            color: "#c62828",
        },
        successText: {
            color: "#2e7d32",
        },
        readOnlyText: {
            color: "#666",
        },
        actions: {
            position: "absolute",
            left: 16,
            right: 16,
            flexDirection: "row",
            gap: 12,
        },
        primaryButton: {
            flex: 1,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 16,
            elevation: 8,
        },
        primaryButtonText: {
            fontSize: 16,
            fontWeight: "700",
        },
        deleteButton: {
            flex: 1,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 16,
            elevation: 8,
        },
        deleteButtonText: {
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
        },
    })
