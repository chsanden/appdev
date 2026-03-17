import { Appearance, StyleSheet } from "react-native"

export const uploadProgressBarStyles = StyleSheet.create({
    container: {
        gap: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
    percentage: {
        fontSize: 13,
        fontWeight: "600",
    },
    track: {
        height: 10,
        borderWidth: 1,
        borderRadius: 999,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 999,
    },
})

export const parallaxScrollViewStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 250,
        overflow: "hidden",
    },
    content: {
        flex: 1,
        padding: 32,
        gap: 16,
        overflow: "hidden",
    },
})

export const themedTextStyles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    link: {
        lineHeight: 30,
        fontSize: 16,
        color: "#0a7ea4",
    },
})

export const loginScreenStyles = StyleSheet.create({
    keyboardAvoider: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    dismissArea: {
        flex: 1,
        justifyContent: "center",
    },
    form: {
        gap: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    errorText: {
        color: "#c62828",
        fontSize: 14,
    },
    loginButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        backgroundColor: Appearance.getColorScheme() === "light" ? "#000000" : "#696969",
        marginTop: 8,
    },
    loginButtonPressed: {
        opacity: 0.85,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    link: {
        alignSelf: "center",
        marginTop: 8,
    },
    linkText: {
        color: "#0b57d0",
        fontSize: 16,
    },
})

export const signupScreenStyles = StyleSheet.create({
    keyboardAvoider: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    dismissArea: {
        flex: 1,
        justifyContent: "center",
    },
    form: {
        gap: 12,
    },
    backButton: {
        alignSelf: "flex-start",
        paddingVertical: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    errorText: {
        color: "#c62828",
        fontSize: 14,
    },
    successText: {
        color: "#2e7d32",
        fontSize: 14,
    },
    actionButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        backgroundColor: "#111",
        marginTop: 8,
    },
    actionButtonPressed: {
        opacity: 0.85,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    link: {
        alignSelf: "center",
        marginTop: 8,
    },
    linkText: {
        color: "#0b57d0",
        fontSize: 16,
    },
})

export const signOutButtonStyles = StyleSheet.create({
    button: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: "600",
    },
})

export const collapsibleStyles = StyleSheet.create({
    heading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    content: {
        marginTop: 6,
        marginLeft: 24,
    },
})

export const homeScreenStyles = StyleSheet.create({
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
        paddingTop: 12,
    },
    tabButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 10,
        alignItems: "center",
    },
    tabButtonActive: {
        backgroundColor: Appearance.getColorScheme() === "light" ? "#000000" : "#8a8888",
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    tabButtonTextActive: {
        color: "#fff",
    },
    list: { padding: 16, gap: 12, paddingTop: 8 },
    noteItem: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 8 },
    noteCardRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
    },
    noteBody: {
        flex: 1,
        gap: 8,
    },
    noteTitle: { fontSize: 16, fontWeight: "600" },
    noteThumbnailFrame: {
        width: 110,
        height: 110,
        alignItems: "center",
        justifyContent: "center",
    },
    noteThumbnail: {
        width: "100%",
        height: "100%",
    },
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
    fab: {
        position: "absolute",
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    fabText: { fontSize: 28, lineHeight: 28, fontWeight: "700" },
})

export const noteImagePanelStyles = StyleSheet.create({
    section: {
        gap: 12,
    },
    previewCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    previewLayout: {
        flexDirection: "row",
        gap: 12,
        alignItems: "stretch",
    },
    previewLayoutStacked: {
        flexDirection: "column",
    },
    previewDetails: {
        flex: 0.95,
        gap: 6,
        minWidth: 0,
    },
    previewFrame: {
        flex: 1.7,
        minHeight: 220,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    previewImage: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
        backgroundColor: "#ffffff",
    },
    previewMetaLabel: {
        fontSize: 13,
        fontWeight: "700",
    },
    previewMeta: {
        fontSize: 13,
    },
    urlText: {
        fontSize: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    helperText: {
        fontSize: 12,
    },
    buttonRow: {
        gap: 10,
    },
    actionButton: {
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
    enabledButtonShadow: {
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 6,
    },
    disabledButton: {
        opacity: 0.45,
        shadowOpacity: 0,
        elevation: 0,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: "700",
    },
    secondaryButton: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    removeButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    fullscreenOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
    },
    fullscreenBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    fullscreenCard: {
        width: "100%",
        maxWidth: 900,
        height: "82%",
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    closeButton: {
        alignSelf: "flex-end",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    fullscreenImage: {
        flex: 1,
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#d7d7d7",
    },
})

export const newNoteScreenStyles = StyleSheet.create({
    keyboardAvoider: { flex: 1 },
    container: { flex: 1 },
    formContent: { padding: 16, gap: 12 },
    titleInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 22,
        fontWeight: "700",
    },
    contentInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    actions: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    actionsBlur: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    actionsContent: {
        borderTopWidth: 1,
        paddingTop: 10,
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    enabledButtonShadow: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.45,
        shadowOpacity: 0,
        elevation: 0,
    },
    saveFloatingText: {
        fontSize: 16,
        fontWeight: "700",
    },
    errorText: {
        color: "#c62828",
    },
})

export const detailScreenStyles = StyleSheet.create({
    keyboardAvoider: { flex: 1 },
    container: { flex: 1 },
    formContent: { padding: 16, gap: 12 },
    title: { fontSize: 22, fontWeight: "700" },
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
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    actionsBlur: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    actionsContent: {
        flexDirection: "row",
        gap: 12,
        borderTopWidth: 1,
        paddingTop: 10,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    enabledButtonShadow: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
    },
    deleteButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.45,
        shadowOpacity: 0,
        elevation: 0,
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
})
