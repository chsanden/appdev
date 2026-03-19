import { renderRouter, screen, waitFor } from "expo-router/testing-library"
import React from "react"

jest.mock("@/providers/auth-provider", () => {
    const React = require("react")
    const { AuthContext } = require("@/hooks/use-auth-context")

    return {
        __esModule: true,
        default: ({ children }: React.PropsWithChildren) =>
            React.createElement(
                AuthContext.Provider,
                {
                    value: {
                        claims: null,
                        profile: null,
                        isLoading: false,
                        isLoggedIn: false,
                    },
                },
                children
            ),
    }
})

jest.mock("@/libs/supabase", () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "test-anon-key",
}))

describe("Auth guard", () => {
    it("redirects logged-out users to the login screen instead of protected content", async () => {
        const routerScreen = renderRouter("./app", {
            initialUrl: "/",
        })

        await waitFor(() => {
            expect(routerScreen.getPathname()).toBe("/login")
        })

        expect(screen.getByText("Login")).toBeTruthy()
        expect(screen.getByText("Log in")).toBeTruthy()
        expect(screen.queryByText("FastNotes")).toBeNull()
    })
})
