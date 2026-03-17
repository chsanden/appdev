import { Image } from "expo-image"
import { useState } from "react"
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native"

import { formatBytes, StagedNoteImage } from "@/src/notes/image-utils"
import { noteImagePanelStyles as styles } from "@/src/styles/app-styles"

type Palette = {
    surface: string
    elevated: string
    text: string
    mutedText: string
    border: string
    accent: string
    destructive: string
}

type NoteImagePanelProps = {
    canEdit: boolean
    isBusy?: boolean
    currentImageUrl?: string | null
    currentImageMimeType?: string | null
    currentImageSizeBytes?: number | null
    stagedImage?: StagedNoteImage | null
    helperText?: string | null
    palette: Palette
    primaryTextColor: string
    onTakePhoto?: () => void
    onChooseFromLibrary?: () => void
    onRemoveImage?: () => void
}

export default function NoteImagePanel({
    canEdit,
    isBusy = false,
    currentImageUrl,
    currentImageMimeType,
    currentImageSizeBytes,
    stagedImage,
    helperText,
    palette,
    primaryTextColor,
    onTakePhoto,
    onChooseFromLibrary,
    onRemoveImage,
}: NoteImagePanelProps) {
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
    const { width } = useWindowDimensions()
    const previewUri = stagedImage?.uri ?? currentImageUrl ?? null
    const mimeType = stagedImage?.mimeType ?? currentImageMimeType ?? null
    const sizeBytes = stagedImage?.fileSize ?? currentImageSizeBytes ?? null
    const useStackedLayout = width < 680

    return (
        <View style={styles.section}>
            {previewUri ? (
                <View
                    style={[
                        styles.previewCard,
                        styles.previewLayout,
                        useStackedLayout ? styles.previewLayoutStacked : null,
                        { borderColor: palette.border, backgroundColor: palette.elevated },
                    ]}
                >
                    <View style={styles.previewDetails}>
                        <Text style={[styles.previewMetaLabel, { color: palette.text }]}>
                            {stagedImage ? "Staged image" : "Saved image"}
                        </Text>
                        <Text style={[styles.previewMeta, { color: palette.mutedText }]}>
                            {(mimeType ?? "Unknown type").toUpperCase()}
                        </Text>
                        <Text style={[styles.previewMeta, { color: palette.mutedText }]}>
                            {formatBytes(sizeBytes)}
                        </Text>
                        {!stagedImage && currentImageUrl ? (
                            <Text selectable numberOfLines={3} style={[styles.urlText, { color: palette.mutedText }]}>
                                {currentImageUrl}
                            </Text>
                        ) : null}
                    </View>
                    <Pressable
                        disabled={!previewUri}
                        onPress={() => {
                            if (previewUri) {
                                setIsFullscreenOpen(true)
                            }
                        }}
                        style={styles.previewFrame}
                    >
                        <Image
                            source={{ uri: previewUri }}
                            style={styles.previewImage}
                            contentFit="contain"
                        />
                    </Pressable>
                </View>
            ) : (
                <Text style={[styles.emptyText, { color: palette.mutedText }]}>
                    No image attached.
                </Text>
            )}

            {helperText ? <Text style={[styles.helperText, { color: palette.mutedText }]}>{helperText}</Text> : null}

            {canEdit ? (
                <View style={styles.buttonRow}>
                    <Pressable
                        disabled={isBusy}
                        onPress={onTakePhoto}
                        style={[styles.actionButton, styles.enabledButtonShadow, isBusy ? styles.disabledButton : null, { backgroundColor: palette.accent }]}
                    >
                        <Text style={[styles.actionButtonText, { color: primaryTextColor }]}>Take photo</Text>
                    </Pressable>
                    <Pressable
                        disabled={isBusy}
                        onPress={onChooseFromLibrary}
                        style={[
                            styles.secondaryButton,
                            isBusy ? styles.disabledButton : null,
                            { borderColor: palette.border, backgroundColor: palette.elevated },
                        ]}
                    >
                        <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Choose from gallery</Text>
                    </Pressable>
                    {previewUri ? (
                        <Pressable
                            disabled={isBusy}
                            onPress={onRemoveImage}
                            style={[
                                styles.secondaryButton,
                                isBusy ? styles.disabledButton : null,
                                { borderColor: palette.destructive, backgroundColor: palette.surface },
                            ]}
                        >
                            <Text style={[styles.removeButtonText, { color: palette.destructive }]}>Remove image</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            <Modal
                visible={isFullscreenOpen}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setIsFullscreenOpen(false)
                }}
            >
                <View style={styles.fullscreenOverlay}>
                    <Pressable
                        style={styles.fullscreenBackdrop}
                        onPress={() => {
                            setIsFullscreenOpen(false)
                        }}
                    />
                    <View style={[styles.fullscreenCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                        <Pressable
                            onPress={() => {
                                setIsFullscreenOpen(false)
                            }}
                            style={[styles.closeButton, { borderColor: palette.border, backgroundColor: palette.elevated }]}
                        >
                            <Text style={[styles.closeButtonText, { color: palette.text }]}>Close</Text>
                        </Pressable>
                        {previewUri ? (
                            <Image source={{ uri: previewUri }} style={styles.fullscreenImage} contentFit="contain" />
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    )
}
