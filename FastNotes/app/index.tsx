import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useNotes } from "@/src/notes/NotesContext";
import SignOutButton from '@/components/social-auth-buttons/sign-out-button'

type TabKey = "my-notes" | "work-notes"

export default function HomeScreen() 
{
  const { claims } = useAuthContext();
  const { errorMessage, isLoading, notes } = useNotes();
  const [activeTab, setActiveTab] = useState<TabKey>("my-notes");
  const insets = useSafeAreaInsets();
  const userId = claims?.sub;

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        activeTab === "my-notes" ? note.createdBy === userId : note.createdBy !== userId
      ),
    [activeTab, notes, userId]
  );

  const emptyText =
    activeTab === "my-notes"
      ? "No personal notes yet. Create your first note."
      : "No work notes yet."

  const formatTimestamp = (value: string) => {
    const parsed = new Date(value)

    if (Number.isNaN(parsed.getTime())) {
      return "Unknown"
    }

    return parsed.toLocaleString()
  }

return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenTitle}>FastNotes</Text>
        <SignOutButton />
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("my-notes")}
          style={[
            styles.tabButton,
            activeTab === "my-notes" ? styles.tabButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "my-notes" ? styles.tabButtonTextActive : null,
            ]}
          >
            My Notes
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("work-notes")}
          style={[
            styles.tabButton,
            activeTab === "work-notes" ? styles.tabButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "work-notes" ? styles.tabButtonTextActive : null,
            ]}
          >
            Work Notes
          </Text>
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <FlatList
        data={filteredNotes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "Loading notes..." : emptyText}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.noteItem}
            onPress={() =>
              router.push({
                pathname: "/detail",
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.notePreview}>{item.content}</Text>
            <Text style={styles.noteMeta}>Created by {item.creatorLabel}</Text>
            <Text style={styles.noteMeta}>
              Last changed {formatTimestamp(item.lastChangedAt)}
            </Text>
          </Pressable>
        )}
      />

      {activeTab === "my-notes" ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 24, right: insets.right + 40 }]}
          onPress={() => router.push("/newNote")}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#e6e6e6",
  },
  tabButtonActive: {
    backgroundColor: "#111",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  list: { padding: 16, gap: 12, paddingTop: 8 },
  noteItem: { padding: 16, borderWidth: 1, borderRadius:12, gap: 8 },
  noteTitle: { fontSize: 16, fontWeight: "600" },
  notePreview: { fontSize: 14, color: "#444" },
  noteMeta: { fontSize: 12, color: "#666" },
  emptyText: {
    textAlign: "center",
    paddingVertical: 32,
    color: "#666",
  },
  errorText: {
    color: "#c62828",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fab: 
  {
    position: "absolute",
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "grey"
  },
  fabText: { fontSize: 28, lineHeight: 28, fontWeight: "700"}
});
