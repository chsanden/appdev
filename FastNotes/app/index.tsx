import { useMemo, useState } from "react"
import { Appearance, FlatList, Pressable, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthContext } from "@/hooks/use-auth-context"
import { useNotes } from "@/src/notes/NotesContext"
import SignOutButton from '@/components/social-auth-buttons/sign-out-button'
import { useAppTheme } from "@/src/theme/AppThemeProvider"


type TabKey = "my-notes" | "work-notes"

export default function HomeScreen() 
{
  const { claims } = useAuthContext()
  const { errorMessage, isLoading, notes } = useNotes()
  const [activeTab, setActiveTab] = useState<TabKey>("my-notes")
  const insets = useSafeAreaInsets()
  const { colorScheme, palette } = useAppTheme()
  const userId = claims?.sub

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        activeTab === "my-notes" ? note.createdBy === userId : note.createdBy !== userId
      ),
    [activeTab, notes, userId]
  )

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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Text style={[styles.screenTitle, { color: palette.text }]}>FastNotes</Text>
        <SignOutButton />
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("my-notes")}
          style={[
            styles.tabButton,
            { backgroundColor: palette.elevated, borderColor: palette.border },
            activeTab === "my-notes" ? styles.tabButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: palette.text },
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
            { backgroundColor: palette.elevated, borderColor: palette.border },
            activeTab === "work-notes" ? styles.tabButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: palette.text },
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
            style={[styles.noteItem, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() =>
              router.push({
                pathname: "/detail",
                params: { id: item.id },
              })
            }
          >
            <Text style={[styles.noteTitle, { color: palette.text }]}>{item.title}</Text>
            <Text numberOfLines={2} style={[styles.notePreview, { color: palette.mutedText }]}>{item.content}</Text>
            <Text style={[styles.noteMeta, { color: palette.mutedText }]}>Created by {item.creatorLabel}</Text>
            <Text style={[styles.noteMeta, { color: palette.mutedText }]}>
              Last changed {formatTimestamp(item.lastChangedAt)}
            </Text>
          </Pressable>
        )}
      />

      {activeTab === "my-notes" ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 24, right: insets.right + 40, backgroundColor: palette.accent }]}
          onPress={() => router.push("/newNote")}
        >
          <Text style={[styles.fabText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>+</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
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
    paddingTop: 12
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: Appearance.getColorScheme() === "light" ? "#000000":"#8a8888",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  list: { padding: 16, gap: 12, paddingTop: 8 },
  noteItem: { padding: 16, borderWidth: 1, borderRadius:12, gap: 8 },
  noteTitle: { fontSize: 16, fontWeight: "600" },
  notePreview: { fontSize: 14 },
  noteMeta: { fontSize: 12 },
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
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: { fontSize: 28, lineHeight: 28, fontWeight: "700"}
})
