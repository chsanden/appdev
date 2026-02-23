import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotes } from "@/src/notes/NotesContext";

export default function HomeScreen() 
{
  const { notes } = useNotes();
  const insets = useSafeAreaInsets();

return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        renderItem={({ item }) => (
          <Pressable
            style={styles.noteItem}
            onPress={() =>
              router.push({
                pathname: "/detail",
                params: { title: item.title, content: item.content },
              })
            }
          >
            <Text style={styles.noteTitle}>{item.title}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24, right: insets.right + 40 }]}
        onPress={() => router.push("/newNote")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12, paddingTop: 20 },
  noteItem: { padding: 16, borderWidth: 1, borderRadius:12 },
  noteTitle: { fontSize: 16, fontWeight: "600" },
  fab: 
  {
    position: "absolute",
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "grey"
  },
  fabText: { fontSize: 28, lineHeight: 28, fontWeight: "700"}
});
