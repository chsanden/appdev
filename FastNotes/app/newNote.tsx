import 
{ 
    StyleSheet, Text, View, KeyboardAvoidingView, 
    Platform, Pressable, TextInput, ScrollView
} from "react-native";
import { router, } from "expo-router";
import { useNotes } from "@/src/notes/NotesContext";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";



export default function NewNoteScreen() 
{
    const { addNote } = useNotes();
    const[title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const [contentHeight, setContentHeight] = useState(160);
    const scrollRef = useRef<ScrollView>(null);

    const onSave = () => 
    {
        if(!title.trim() && !content.trim()) return;
        addNote(title, content);
        router.back();
    };

    return (
      <KeyboardAvoidingView style={{ flex: 1}} behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}>
        <View style={styles.container}>
            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10}}
            keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Title</Text>
                <TextInput value={title} onChangeText={setTitle}
                placeholder="Give it a title..." style={styles.input}
                returnKeyType="next"/>

                <Text style={styles.label}>Content</Text>
                <TextInput value={content} onChangeText={setContent} placeholder="Write your note..."
                style={[styles.input, { height: Math.max(160, contentHeight) }]} multiline 
                textAlignVertical="top"
                onContentSizeChange={(e) => {setContentHeight(e.nativeEvent.contentSize.height);
                    scrollRef.current?.scrollToEnd({ animated: true });
                }}/>

            </ScrollView>
            <View>
                <Pressable onPress={onSave}
                    style={[styles.saveFloating, { bottom: insets.bottom + 16 }]}>
                    <Text style={styles.saveFloatingText}>Save</Text>
                </Pressable>
            </View>
        </View>
      </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create(
    { 
        container: { flex: 1, gap: 10 },
        label: { fontSize: 14, fontWeight: "600" },
        input: 
        { 
            borderWidth: 1, borderRadius: 7, 
            padding: 12, fontSize: 16
        },
        saveBtn:
        {
            borderRadius: 12,
            paddingVertical: 14, alignItems: "center",
            backgroundColor: "grey"
        },
        saveText: { color: "white", fontSize: 16, fontWeight: "700"},
        saveBar: 
        {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: 12,
            paddingHorizontal: 16,
            backgroundColor: "white",
            borderTopWidth: 1
        },
        saveFloating: 
        {
            position: "absolute",
            left: 16,
            right: 16,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: "#111"
        },
        saveFloatingText: 
        {
            color: "white",
            fontSize: 16,
            fontWeight: "700"
        }
    }
);