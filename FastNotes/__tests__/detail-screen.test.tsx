import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import React, { PropsWithChildren } from "react"

import DetailScreen from "@/app/detail"
import { AuthContext, AuthData } from "@/hooks/use-auth-context"
import { supabase } from "@/libs/supabase"
import { pickImageFromCamera, pickImageFromLibrary } from "@/src/notes/native-image-picker"
import { NotesProvider } from "@/src/notes/NotesContext"
import { AppThemeProvider } from "@/src/theme/AppThemeProvider"
import { useLocalSearchParams } from "expo-router"
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

jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(),
    },
    useLocalSearchParams: jest.fn(),
}))

jest.mock("@/libs/supabase", () => ({
    supabase: {
        from: jest.fn(),
    },
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "test-anon-key",
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

describe("DetailScreen", () => {
    const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>
    const mockSupabase = supabase as unknown as {
        from: jest.Mock
    }
    const mockPickImageFromCamera = pickImageFromCamera as jest.MockedFunction<typeof pickImageFromCamera>
    const mockPickImageFromLibrary = pickImageFromLibrary as jest.MockedFunction<typeof pickImageFromLibrary>
    const mockUseIsFocused = useIsFocused as jest.MockedFunction<typeof useIsFocused>

    function TestWrapper({ children }: PropsWithChildren) {
        const authValue: AuthData = {
            claims: {
                sub: "user-1",
                email: "user-1@example.com",
            },
            profile: {
                id: "user-1",
                email: "user-1@example.com",
                username: null,
                full_name: null,
            },
            isLoading: false,
            isLoggedIn: true,
        }

        return (
            <AppThemeProvider>
                <AuthContext.Provider value={authValue}>
                    <NotesProvider>{children}</NotesProvider>
                </AuthContext.Provider>
            </AppThemeProvider>
        )
    }

    beforeEach(() => {
        mockUseLocalSearchParams.mockReturnValue({ id: "42" })
        mockPickImageFromCamera.mockResolvedValue(null)
        mockPickImageFromLibrary.mockResolvedValue(null)
        mockUseIsFocused.mockReturnValue(true)
    })

    async function renderLoadedDetailScreen() {
        const notesQuery = {
            order: jest.fn(),
            eq: jest.fn(),
            maybeSingle: jest.fn(() =>
                Promise.resolve({
                    data: {
                        id: 42,
                        created_by: "user-1",
                        title: "Fetched note",
                        content: "Loaded from Supabase for the integration test",
                        created_at: "2026-03-18T10:00:00.000Z",
                        updated_at: "2026-03-18T10:05:00.000Z",
                        image_url: null,
                        image_path: null,
                        image_mime_type: null,
                        image_size_bytes: null,
                    },
                    error: null,
                })
            ),
        }

        notesQuery.order
            .mockImplementationOnce(() => notesQuery)
            .mockImplementationOnce(() => Promise.resolve({ data: [], error: null }))
        notesQuery.eq.mockReturnValue(notesQuery)

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === "Notes") {
                return {
                    select: jest.fn(() => notesQuery),
                }
            }

            if (table === "profiles") {
                return {
                    select: jest.fn(() => ({
                        in: jest.fn(() =>
                            Promise.resolve({
                                data: [
                                    {
                                        id: "user-1",
                                        email: "user-1@example.com",
                                        username: null,
                                        full_name: "Exam User",
                                    },
                                ],
                                error: null,
                            })
                        ),
                    })),
                }
            }

            throw new Error(`Unexpected table requested in test: ${table}`)
        })

        const rendered = render(<DetailScreen />, {
            wrapper: TestWrapper,
        })

        await waitFor(() => {
            expect(screen.getByDisplayValue("Fetched note")).toBeTruthy()
        })

        return rendered
    }

    it("shows a loader while fetching a note, then renders the loaded content", async () => {
        const deferredNote = createDeferred<{
            data: {
                id: number
                created_by: string
                title: string
                content: string
                created_at: string
                updated_at: string
                image_url: null
                image_path: null
                image_mime_type: null
                image_size_bytes: null
            } | null
            error: null
        }>()
        const notesQuery = {
            order: jest.fn(),
            eq: jest.fn(),
            maybeSingle: jest.fn(() => deferredNote.promise),
        }

        notesQuery.order
            .mockImplementationOnce(() => notesQuery)
            .mockImplementationOnce(() => Promise.resolve({ data: [], error: null }))
        notesQuery.eq.mockReturnValue(notesQuery)

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === "Notes") {
                return {
                    select: jest.fn(() => notesQuery),
                }
            }

            if (table === "profiles") {
                return {
                    select: jest.fn(() => ({
                        in: jest.fn(() =>
                            Promise.resolve({
                                data: [
                                    {
                                        id: "user-1",
                                        email: "user-1@example.com",
                                        username: null,
                                        full_name: "Exam User",
                                    },
                                ],
                                error: null,
                            })
                        ),
                    })),
                }
            }

            throw new Error(`Unexpected table requested in test: ${table}`)
        })

        render(<DetailScreen />, {
            wrapper: TestWrapper,
        })

        await waitFor(() => {
            expect(screen.getByTestId("note-detail-loader")).toBeTruthy()
            expect(screen.getByText("Loading note...")).toBeTruthy()
        })

        await act(async () => {
            deferredNote.resolve({
                data: {
                    id: 42,
                    created_by: "user-1",
                    title: "Fetched note",
                    content: "Loaded from Supabase for the integration test",
                    created_at: "2026-03-18T10:00:00.000Z",
                    updated_at: "2026-03-18T10:05:00.000Z",
                    image_url: null,
                    image_path: null,
                    image_mime_type: null,
                    image_size_bytes: null,
                },
                error: null,
            })

            await deferredNote.promise
        })

        await waitFor(() => {
            expect(screen.queryByTestId("note-detail-loader")).toBeNull()
            expect(screen.getByDisplayValue("Fetched note")).toBeTruthy()
            expect(screen.getByDisplayValue("Loaded from Supabase for the integration test")).toBeTruthy()
        })
    })

    it("only launches the camera once while a picker request is active", async () => {
        const deferredCamera = createDeferred<Awaited<ReturnType<typeof pickImageFromCamera>>>()
        mockPickImageFromCamera.mockReturnValue(deferredCamera.promise)

        await renderLoadedDetailScreen()

        fireEvent.press(screen.getByText("Take photo"))
        fireEvent.press(screen.getByText("Take photo"))

        expect(mockPickImageFromCamera).toHaveBeenCalledTimes(1)

        await act(async () => {
            deferredCamera.resolve({
                fileName: "detail-camera.jpg",
                fileSize: 1024,
                height: 200,
                mimeType: "image/jpeg",
                uri: "file:///detail-camera.jpg",
                width: 100,
            })

            await deferredCamera.promise
        })

        expect(screen.getByText("detail-camera.jpg")).toBeTruthy()
    })

    it("keeps the detail screen unchanged when the gallery picker is canceled", async () => {
        mockPickImageFromLibrary.mockResolvedValue(null)

        await renderLoadedDetailScreen()

        fireEvent.press(screen.getByText("Choose from gallery"))

        await waitFor(() => {
            expect(mockPickImageFromLibrary).toHaveBeenCalledTimes(1)
        })

        expect(screen.queryByText(/detail-camera\.jpg$/)).toBeNull()
    })

    it("shows the camera error when the picker fails on the detail screen", async () => {
        mockPickImageFromCamera.mockRejectedValue(new Error("Camera access is required to take a photo."))

        await renderLoadedDetailScreen()

        fireEvent.press(screen.getByText("Take photo"))

        await waitFor(() => {
            expect(screen.getByText("Camera access is required to take a photo.")).toBeTruthy()
        })
    })

    it("ignores a late camera result after leaving the detail screen", async () => {
        const deferredCamera = createDeferred<Awaited<ReturnType<typeof pickImageFromCamera>>>()
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
        mockPickImageFromCamera.mockReturnValue(deferredCamera.promise)

        const rendered = await renderLoadedDetailScreen()

        fireEvent.press(screen.getByText("Take photo"))
        rendered.unmount()

        await act(async () => {
            deferredCamera.resolve({
                fileName: "late-detail-camera.jpg",
                fileSize: 1024,
                height: 200,
                mimeType: "image/jpeg",
                uri: "file:///late-detail-camera.jpg",
                width: 100,
            })

            await deferredCamera.promise
        })

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })
})
