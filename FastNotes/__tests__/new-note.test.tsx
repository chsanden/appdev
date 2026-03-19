import { act, fireEvent, screen, waitFor } from "@testing-library/react-native"
import React from "react"

import NewNoteScreen from "@/app/newNote"
import { useNotes } from "@/src/notes/NotesContext"
import { pickImageFromCamera, pickImageFromLibrary } from "@/src/notes/native-image-picker"
import { renderWithTheme } from "@/test-utils/renderWithTheme"
import { router } from "expo-router"
import { useIsFocused } from "@react-navigation/native"

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void

    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve
        reject = innerReject
    })

    return { promise, resolve, reject }
}

const mockAddNote = jest.fn()

jest.mock("expo-router", () => ({
    router: {
        canGoBack: jest.fn(),
        back: jest.fn(),
        replace: jest.fn(),
    },
}))

jest.mock("@/src/notes/NotesContext", () => ({
    useNotes: jest.fn(),
}))

jest.mock("@react-navigation/native", () => {
    const actual = jest.requireActual("@react-navigation/native")

    return {
        ...actual,
        useIsFocused: jest.fn(() => true),
    }
})

jest.mock("@/src/notes/native-image-picker", () => ({
    pickImageFromCamera: jest.fn(),
    pickImageFromLibrary: jest.fn(),
}))

jest.mock("@/components/note-image-panel", () => ({
    __esModule: true,
    default: (props: {
        onChooseFromLibrary?: () => void
        onTakePhoto?: () => void
        stagedImage?: { fileName?: string | null } | null
    }) => {
        const React = require("react")
        const { Pressable, Text, View } = require("react-native")

        return (
            <View>
                <Pressable onPress={props.onTakePhoto}>
                    <Text>Take photo</Text>
                </Pressable>
                <Pressable onPress={props.onChooseFromLibrary}>
                    <Text>Choose from gallery</Text>
                </Pressable>
                {props.stagedImage?.fileName ? <Text>{props.stagedImage.fileName}</Text> : null}
            </View>
        )
    },
}))

describe("NewNoteScreen", () => {
    const mockUseNotes = useNotes as jest.MockedFunction<typeof useNotes>
    const mockRouter = router as unknown as {
        canGoBack: jest.Mock
        back: jest.Mock
        replace: jest.Mock
    }
    const mockPickImageFromCamera = pickImageFromCamera as jest.MockedFunction<typeof pickImageFromCamera>
    const mockPickImageFromLibrary = pickImageFromLibrary as jest.MockedFunction<typeof pickImageFromLibrary>
    const mockUseIsFocused = useIsFocused as jest.MockedFunction<typeof useIsFocused>

    beforeEach(() => {
        mockAddNote.mockResolvedValue(true)
        mockPickImageFromCamera.mockResolvedValue(null)
        mockPickImageFromLibrary.mockResolvedValue(null)
        mockUseIsFocused.mockReturnValue(true)

        mockUseNotes.mockReturnValue({
            notes: [],
            isLoading: false,
            refreshNotes: jest.fn(),
            fetchNoteById: jest.fn(),
            addNote: mockAddNote,
            updateNote: jest.fn(),
            deleteNote: jest.fn(),
            errorMessage: null,
        })

        mockRouter.canGoBack.mockReturnValue(true)
    })

    it("submits a valid note and navigates back to the main screen", async () => {
        renderWithTheme(<NewNoteScreen />)

        fireEvent.changeText(screen.getByPlaceholderText("Give it a title..."), "Exam note")
        fireEvent.changeText(screen.getByPlaceholderText("Write your note..."), "Testing the final assignment flow")
        fireEvent.press(screen.getByText("Save note"))

        await waitFor(() => {
            expect(mockAddNote).toHaveBeenCalledWith(
                "Exam note",
                "Testing the final assignment flow",
                null,
                expect.objectContaining({
                    onImageUploadProgress: expect.any(Function),
                })
            )
        })

        await waitFor(() => {
            expect(mockRouter.back).toHaveBeenCalledTimes(1)
        })

        expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it("only launches the camera once while a picker request is active", async () => {
        const deferredCamera = createDeferred<Awaited<ReturnType<typeof pickImageFromCamera>>>()
        mockPickImageFromCamera.mockReturnValue(deferredCamera.promise)

        renderWithTheme(<NewNoteScreen />)

        fireEvent.press(screen.getByText("Take photo"))
        fireEvent.press(screen.getByText("Take photo"))

        expect(mockPickImageFromCamera).toHaveBeenCalledTimes(1)

        await act(async () => {
            deferredCamera.resolve({
                fileName: "captured-note.jpg",
                fileSize: 1024,
                height: 200,
                mimeType: "image/jpeg",
                uri: "file:///captured-note.jpg",
                width: 100,
            })

            await deferredCamera.promise
        })

        expect(screen.getByText("captured-note.jpg")).toBeTruthy()
    })

    it("applies the selected camera image while the screen is still active", async () => {
        mockPickImageFromCamera.mockResolvedValue({
            fileName: "camera-note.jpg",
            fileSize: 512,
            height: 200,
            mimeType: "image/jpeg",
            uri: "file:///camera-note.jpg",
            width: 100,
        })

        renderWithTheme(<NewNoteScreen />)

        fireEvent.press(screen.getByText("Take photo"))

        await waitFor(() => {
            expect(screen.getByText("camera-note.jpg")).toBeTruthy()
        })
    })

    it("keeps the staged image unchanged when the gallery picker is canceled", async () => {
        mockPickImageFromLibrary.mockResolvedValue(null)

        renderWithTheme(<NewNoteScreen />)

        fireEvent.press(screen.getByText("Choose from gallery"))

        await waitFor(() => {
            expect(mockPickImageFromLibrary).toHaveBeenCalledTimes(1)
        })

        expect(screen.queryByText(/\.jpg$/)).toBeNull()
    })

    it("shows the camera error when the native picker fails", async () => {
        mockPickImageFromCamera.mockRejectedValue(new Error("Camera access is required to take a photo."))

        renderWithTheme(<NewNoteScreen />)

        fireEvent.press(screen.getByText("Take photo"))

        await waitFor(() => {
            expect(screen.getByText("Camera access is required to take a photo.")).toBeTruthy()
        })
    })

    it("ignores a late camera result after the screen unmounts", async () => {
        const deferredCamera = createDeferred<Awaited<ReturnType<typeof pickImageFromCamera>>>()
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
        mockPickImageFromCamera.mockReturnValue(deferredCamera.promise)

        const screenRender = renderWithTheme(<NewNoteScreen />)

        fireEvent.press(screen.getByText("Take photo"))
        screenRender.unmount()

        await act(async () => {
            deferredCamera.resolve({
                fileName: "late-camera.jpg",
                fileSize: 1024,
                height: 200,
                mimeType: "image/jpeg",
                uri: "file:///late-camera.jpg",
                width: 100,
            })

            await deferredCamera.promise
        })

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })
})
