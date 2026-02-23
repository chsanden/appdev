import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function DetailScreen()
{
    const { title, content } = useLocalSearchParams<
    {
        title?: string;
        content?: string;
    }>();

    return(
        <View style={styles.container}>
            <Text style={styles.title}>{title ?? "(No title)"}</Text>
            <Text style={styles.content}>{content ?? ""}</Text>
        </View>
    );
}


const styles = StyleSheet.create(
    {
        container: { flex: 1, padding: 16, gap: 12 },
        title: { fontSize: 22, fontWeight:"700" },
        content: { fontSize: 16 }
    });