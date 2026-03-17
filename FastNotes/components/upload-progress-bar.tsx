import { Text, View } from "react-native"
import { uploadProgressBarStyles as styles } from "@/src/styles/app-styles"

type Palette = {
    accent: string
    border: string
    elevated: string
    mutedText: string
    text: string
}

type UploadProgressBarProps = {
    progress: number
    label?: string
    palette: Palette
}

export default function UploadProgressBar({
    progress,
    label = "Uploading image...",
    palette,
}: UploadProgressBarProps) {
    const clampedProgress = Math.max(0, Math.min(100, progress))

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
                <Text style={[styles.percentage, { color: palette.mutedText }]}>{clampedProgress}%</Text>
            </View>
            <View style={[styles.track, { borderColor: palette.border, backgroundColor: palette.elevated }]}>
                <View style={[styles.fill, { width: `${clampedProgress}%`, backgroundColor: palette.accent }]} />
            </View>
        </View>
    )
}
