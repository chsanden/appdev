import 
{ 
    StyleSheet, Text, View, KeyboardAvoidingView, 
    Platform, Pressable, TextInput, ScrollView
} from "react-native"
import { router, } from "expo-router"
import { useNotes } from "@/src/notes/NotesContext"
import { useState, useRef } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useHeaderHeight } from "@react-navigation/elements"
import { useAppTheme } from "@/src/theme/AppThemeProvider"



export default function NewNoteScreen() 
{
    const { addNote, errorMessage } = useNotes()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null)
    const insets = useSafeAreaInsets()
    const headerHeight = useHeaderHeight()
    const { colorScheme, palette } = useAppTheme()
    const [contentHeight, setContentHeight] = useState(160)
    const scrollRef = useRef<ScrollView>(null)

    const onSave = async () => 
    {
        if(!title.trim() || !content.trim()) {
            setLocalErrorMessage("Title and content are required.")
            return
        }

        setIsSaving(true)
        setLocalErrorMessage(null)

        const wasSaved = await addNote(title, content)

        setIsSaving(false)

        if (wasSaved) {
            router.back()
        }
    }

    return (
      <KeyboardAvoidingView
      style={styles.keyboardAvoider}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}>
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            <ScrollView ref={scrollRef} contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 112 }]}
            keyboardShouldPersistTaps="handled">
                <TextInput value={title} onChangeText={setTitle}
                placeholder="Give it a title..." style={[styles.titleInput, { color: palette.text, borderColor: palette.border, backgroundColor: palette.input }]}
                placeholderTextColor={palette.mutedText}
                returnKeyType="next"/>

                <TextInput value={content} onChangeText={setContent} placeholder="Write your note..."
                style={[styles.contentInput, { minHeight: Math.max(200, contentHeight), color: palette.text, borderColor: palette.border, backgroundColor: palette.input }]} multiline 
                placeholderTextColor={palette.mutedText}
                textAlignVertical="top"
                onContentSizeChange={(e) => {setContentHeight(e.nativeEvent.contentSize.height) 
                    scrollRef.current?.scrollToEnd({ animated: true })
                }}/>

                {localErrorMessage ? (
                    <Text style={styles.errorText}>{localErrorMessage}</Text>
                ) : null}

                {!localErrorMessage && errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

            </ScrollView>
            <View style={[styles.actions, { bottom: insets.bottom + 16 }]}>
                <Pressable disabled={isSaving} onPress={onSave}
                    style={[styles.saveButton, { backgroundColor: palette.accent }]}>
                    <Text style={[styles.saveFloatingText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>
                        {isSaving ? "Saving..." : "Save note"}
                    </Text>
                </Pressable>
            </View>
        </View>
      </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create(
    { 
        keyboardAvoider: { flex: 1 },
        container: { flex: 1 },
        formContent: { padding: 16, gap: 12 },
        titleInput:
        { 
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            fontSize: 22,
            fontWeight: "700",
        },
        contentInput:
        {
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
        },
        actions: {
            position: "absolute",
            left: 16,
            right: 16,
            flexDirection: "row",
            gap: 12,
        },
        saveButton: 
        {
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
        saveFloatingText: 
        {
            fontSize: 16,
            fontWeight: "700"
        },
        errorText: {
            color: "#c62828"
        },
    }
)
