import { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Animated, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, View } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Image } from "expo-image"
import { useAuthContext } from "@/hooks/use-auth-context"
import { type Note, useNotes } from "@/src/notes/NotesContext"
import SignOutButton from "@/components/social-auth-buttons/sign-out-button"
import { useAppTheme } from "@/src/theme/AppThemeProvider"
import { homeScreenStyles as styles } from "@/src/styles/app-styles"

type TabKey = "my-notes" | "work-notes"

const PULL_DISTANCE = 120
const LOAD_MORE_TRIGGER_DISTANCE = 24

export default function HomeScreen() {
  const { claims } = useAuthContext()
  const {
    errorMessage,
    isLoading,
    notes,
    loadMoreNotes,
    hasMoreMyNotes,
    hasMoreWorkNotes,
    isLoadingMoreMyNotes,
    isLoadingMoreWorkNotes,
  } = useNotes()
  const [activeTab, setActiveTab] = useState<TabKey>("my-notes")
  const [showNoMoreNotesBubble, setShowNoMoreNotesBubble] = useState(false)
  const insets = useSafeAreaInsets()
  const { colorScheme, palette } = useAppTheme()
  const userId = claims?.sub
  const listRef = useRef<FlatList<Note>>(null)
  const pullProgress = useRef(new Animated.Value(0)).current
  const isLoadingMoreRequest = useRef<Record<TabKey, boolean>>({
    "my-notes": false,
    "work-notes": false,
  })
  const shouldLoadMoreOnRelease = useRef(false)
  const hideNoMoreNotesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        activeTab === "my-notes" ? note.createdBy === userId : note.createdBy !== userId
      ),
    [activeTab, notes, userId]
  )

  const activeHasMore = activeTab === "my-notes" ? hasMoreMyNotes : hasMoreWorkNotes
  const activeIsLoadingMore =
    activeTab === "my-notes" ? isLoadingMoreMyNotes : isLoadingMoreWorkNotes

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height)
    const progress = Math.max(0, Math.min(1, (PULL_DISTANCE - distanceFromBottom) / PULL_DISTANCE))
    const canScroll = contentSize.height > layoutMeasurement.height
    const isNearBottom = distanceFromBottom <= LOAD_MORE_TRIGGER_DISTANCE

    pullProgress.setValue(progress)
    shouldLoadMoreOnRelease.current = canScroll && contentOffset.y > 0 && isNearBottom
  }

  const handleLoadMore = () => {
    if (!activeHasMore || activeIsLoadingMore || isLoadingMoreRequest.current[activeTab]) {
      if (!activeHasMore) {
        setShowNoMoreNotesBubble(true)
      }
      return
    }

    isLoadingMoreRequest.current[activeTab] = true

    void loadMoreNotes(activeTab).finally(() => {
      isLoadingMoreRequest.current[activeTab] = false
    })
  }

  const handleScrollEndDrag = () => {
    if (shouldLoadMoreOnRelease.current) {
      if (!activeHasMore) {
        setShowNoMoreNotesBubble(true)
      }
      handleLoadMore()
    }
  }

  useEffect(() => {
    pullProgress.setValue(0)
    shouldLoadMoreOnRelease.current = false
    setShowNoMoreNotesBubble(false)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [activeTab, pullProgress])

  useEffect(() => {
    if (!showNoMoreNotesBubble) {
      if (hideNoMoreNotesTimer.current) {
        clearTimeout(hideNoMoreNotesTimer.current)
        hideNoMoreNotesTimer.current = null
      }
      return
    }

    hideNoMoreNotesTimer.current = setTimeout(() => {
      setShowNoMoreNotesBubble(false)
    }, 5000)

    return () => {
      if (hideNoMoreNotesTimer.current) {
        clearTimeout(hideNoMoreNotesTimer.current)
        hideNoMoreNotesTimer.current = null
      }
    }
  }, [showNoMoreNotesBubble])

  const stemHeight = pullProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 28],
    extrapolate: "clamp",
  })

  const arrowScale = pullProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.2],
    extrapolate: "clamp",
  })

  const arrowOpacity = pullProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  })

  const hintOpacity = activeIsLoadingMore ? 1 : arrowOpacity

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: palette.surface,
            borderBottomColor: palette.border,
          },
        ]}
      >
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
        ref={listRef}
        data={filteredNotes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: 160 }]}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
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
            <View style={styles.noteCardRow}>
              <View style={styles.noteBody}>
                <Text style={[styles.noteTitle, { color: palette.text }]}>{item.title}</Text>
                <Text numberOfLines={2} style={[styles.notePreview, { color: palette.mutedText }]}>
                  {item.content}
                </Text>
                <Text style={[styles.noteMeta, { color: palette.mutedText }]}>
                  Created by {item.creatorLabel}
                </Text>
                <Text style={[styles.noteMeta, { color: palette.mutedText }]}>
                  Last changed {formatTimestamp(item.lastChangedAt)}
                </Text>
              </View>
              {item.imageUrl ? (
                <View style={styles.noteThumbnailFrame}>
                  <Image source={{ uri: item.imageUrl }} style={styles.noteThumbnail} contentFit="contain" />
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      <View
        pointerEvents="none"
        style={[
          styles.loadMoreHint,
          {
            bottom: insets.bottom + (activeTab === "my-notes" ? 24 : 24),
          },
        ]}
      >
        {activeHasMore || activeIsLoadingMore ? (
          <Animated.View
            style={[
              styles.loadMoreHintArrowOnly,
              {
                opacity: hintOpacity,
              },
            ]}
          >
            <View style={styles.loadMoreHintGlyphColumn}>
              <Animated.View
                style={[
                  styles.loadMoreHintStem,
                  {
                    backgroundColor: palette.accent,
                    height: activeIsLoadingMore ? 28 : stemHeight,
                    opacity: hintOpacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.loadMoreHintGlyph,
                  {
                    transform: [{ scale: activeIsLoadingMore ? 1.15 : arrowScale }],
                    opacity: hintOpacity,
                  },
                ]}
              >
                {activeIsLoadingMore ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={palette.accent} />
                )}
              </Animated.View>
            </View>
          </Animated.View>
        ) : showNoMoreNotesBubble ? (
          <View
            style={[
              styles.loadMoreHintCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: 0.92,
              },
              styles.loadMoreHintCardCompact,
            ]}
          >
            <Text style={[styles.loadMoreHintTitle, { color: palette.text }]}>No more notes</Text>
          </View>
        ) : null}
      </View>

      {activeTab === "my-notes" ? (
        <Pressable
          style={[
            styles.fab,
            { bottom: insets.bottom + 24, right: insets.right + 40, backgroundColor: palette.accent },
          ]}
          onPress={() => router.push("/newNote")}
        >
          <Text style={[styles.fabText, { color: colorScheme === "dark" ? "#000" : "#fff" }]}>+</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
