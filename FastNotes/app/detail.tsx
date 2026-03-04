import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useNotes } from "@/src/notes/NotesContext";


export default function DetailScreen()
{
    const { id } = useLocalSearchParams<
    {
        id?: string;
    }>();
    const { claims } = useAuthContext();
    const { deleteNote, errorMessage, notes, updateNote } = useNotes();
    const note = notes.find((entry) => entry.id === id);
    const canEdit = note?.createdBy === claims?.sub;
    const [title, setTitle] = useState(note?.title ?? "");
    const [content, setContent] = useState(note?.content ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const formatTimestamp = (value: string) => {
        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime())) {
            return "Unknown";
        }

        return parsed.toLocaleString();
    };

    useEffect(() => {
        setTitle(note?.title ?? "");
        setContent(note?.content ?? "");
    }, [note?.content, note?.title]);

    const onSave = async () => {
        if (!id) {
            setLocalErrorMessage("This note could not be found.");
            return;
        }

        if (!title.trim() || !content.trim()) {
            setLocalErrorMessage("Title and content are required.");
            return;
        }

        setIsSaving(true);
        setLocalErrorMessage(null);
        setStatusMessage(null);

        const wasSaved = await updateNote(id, title, content);

        setIsSaving(false);

        if (wasSaved) {
            setStatusMessage("Note updated.");
        }
    };

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
                        void onDelete();
                    },
                },
            ]
        );
    };

    const onDelete = async () => {
        if (!id) {
            setLocalErrorMessage("This note could not be found.");
            return;
        }

        setIsDeleting(true);
        setLocalErrorMessage(null);
        setStatusMessage(null);

        const wasDeleted = await deleteNote(id);

        setIsDeleting(false);

        if (wasDeleted) {
            router.replace("/");
        }
    };

    if (!note) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Note not found</Text>
                <Text style={styles.content}>The note may have been deleted.</Text>
            </View>
        );
    }

        return(
        <View style={styles.container}>
            <TextInput
                editable={canEdit}
                onChangeText={setTitle}
                style={styles.titleInput}
                value={title}
            />
            <Text style={styles.signature}>Created by {note.creatorLabel}</Text>
            <Text style={styles.signature}>
                Last changed {formatTimestamp(note.lastChangedAt)}
            </Text>
            <TextInput
                editable={canEdit}
                multiline
                onChangeText={setContent}
                style={styles.contentInput}
                textAlignVertical="top"
                value={content}
            />
            {!canEdit ? (
                <Text style={styles.readOnlyText}>
                    Only the creator of this note can update or delete it.
                </Text>
            ) : null}
            {localErrorMessage ? <Text style={styles.errorText}>{localErrorMessage}</Text> : null}
            {!localErrorMessage && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}
            {canEdit ? (
                <View style={styles.actions}>
                    <Pressable disabled={isSaving} onPress={onSave} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </Text>
                    </Pressable>
                    <Pressable disabled={isDeleting} onPress={confirmDelete} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>
                            {isDeleting ? "Deleting..." : "Delete note"}
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
}


const styles = StyleSheet.create(
    {
        container: { flex: 1, padding: 16, gap: 12 },
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
            flex: 1,
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
            gap: 12,
        },
        primaryButton: {
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: "#111",
        },
        primaryButtonText: {
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
        },
        deleteButton: {
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: "#b71c1c",
        },
        deleteButtonText: {
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
        },
    });
