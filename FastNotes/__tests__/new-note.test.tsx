import { fireEvent, screen, waitFor } from "@testing-library/react-native"
import React from "react"

import NewNoteScreen from "@/app/newNote"
import { useNotes } from "@/src/notes/NotesContext"
import { renderWithTheme } from "@/test-utils/renderWithTheme"
import { router } from "expo-router"

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

jest.mock("@/components/note-image-panel", () => ({
    __esModule: true,
    default: () => null,
}))

describe("NewNoteScreen", () => {
    const mockUseNotes = useNotes as jest.MockedFunction<typeof useNotes>
    const mockRouter = router as unknown as {
        canGoBack: jest.Mock
        back: jest.Mock
        replace: jest.Mock
    }

    beforeEach(() => {
        mockAddNote.mockResolvedValue(true)

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
})
