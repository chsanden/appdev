import * as ImagePicker from "expo-image-picker"
import { Platform } from "react-native"

import { StagedNoteImage } from "@/src/notes/image-utils"

function buildStagedImage(asset: ImagePicker.ImagePickerAsset): StagedNoteImage {
    return {
        uri: asset.uri,
        fileName: asset.fileName ?? `note-image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? null,
        fileSize: asset.fileSize ?? null,
        width: asset.width,
        height: asset.height,
    }
}

function unsupportedPlatformError(action: "camera" | "gallery") {
    return Platform.OS === "web"
        ? `Native ${action} support is only enabled on iOS and Android in this app.`
        : `This device cannot open the ${action}.`
}

export async function pickImageFromLibrary() {
    if (Platform.OS === "web") {
        throw new Error(unsupportedPlatformError("gallery"))
    }

    const permission = await ImagePicker.getMediaLibraryPermissionsAsync()

    if (!permission.granted) {
        const requested = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!requested.granted) {
            throw new Error("Photo library access is required to choose an image.")
        }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 1,
        selectionLimit: 1,
    })

    if (result.canceled || !result.assets?.length) {
        return null
    }

    return buildStagedImage(result.assets[0])
}

export async function pickImageFromCamera() {
    if (Platform.OS === "web") {
        throw new Error(unsupportedPlatformError("camera"))
    }

    const permission = await ImagePicker.getCameraPermissionsAsync()

    if (!permission.granted) {
        const requested = await ImagePicker.requestCameraPermissionsAsync()

        if (!requested.granted) {
            throw new Error("Camera access is required to take a photo.")
        }
    }

    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        cameraType: ImagePicker.CameraType.back,
        mediaTypes: ["images"],
        quality: 1,
    })

    if (result.canceled || !result.assets?.length) {
        return null
    }

    return buildStagedImage(result.assets[0])
}
