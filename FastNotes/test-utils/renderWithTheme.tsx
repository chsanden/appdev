import { render, RenderOptions } from "@testing-library/react-native"
import React, { PropsWithChildren, ReactElement } from "react"

import { AppThemeProvider } from "@/src/theme/AppThemeProvider"

function ThemeWrapper({ children }: PropsWithChildren) {
    return <AppThemeProvider>{children}</AppThemeProvider>
}

export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
    return render(ui, {
        wrapper: ThemeWrapper,
        ...options,
    })
}
