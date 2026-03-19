import "react-native-gesture-handler/jestSetup"

import { cleanup } from "@testing-library/react-native"
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock"

afterEach(() => {
    cleanup()
})

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
)

jest.mock("expo-constants", () => {
    const mockConstants = {
        expoConfig: {
            extra: {
                supabaseUrl: "https://example.supabase.co",
                supabaseKey: "test-anon-key",
            },
        },
        executionEnvironment: "standalone",
    }

    return {
        __esModule: true,
        default: mockConstants,
        ...mockConstants,
    }
})

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext)

jest.mock("react-native-reanimated", () => {
    const Reanimated = require("react-native-reanimated/mock")
    Reanimated.default.call = () => {}
    return Reanimated
})

jest.mock("react-native-screens", () => {
    const React = require("react")
    const { View } = require("react-native")

    const MockScreen = ({ children }: { children?: unknown }) => React.createElement(View, null, children)

    return {
        __esModule: true,
        default: MockScreen,
        compatibilityFlags: {
            usesNewAndroidHeaderHeightImplementation: false,
        },
        Screen: MockScreen,
        ScreenContainer: MockScreen,
        ScreenStack: MockScreen,
        ScreenStackItem: MockScreen,
        ScreenStackHeaderConfig: MockScreen,
        ScreenStackHeaderBackButtonImage: MockScreen,
        ScreenStackHeaderCenterView: MockScreen,
        ScreenStackHeaderLeftView: MockScreen,
        ScreenStackHeaderRightView: MockScreen,
        ScreenStackHeaderSearchBarView: MockScreen,
        SearchBar: MockScreen,
        NativeScreen: MockScreen,
        NativeScreenContainer: MockScreen,
        FullWindowOverlay: MockScreen,
        Freeze: MockScreen,
        enableScreens: jest.fn(),
        isSearchBarAvailableForCurrentPlatform: jest.fn(() => false),
        screensEnabled: jest.fn(),
    }
})

jest.mock("expo-blur", () => {
    const React = require("react")
    const { View } = require("react-native")

    return {
        BlurView: ({ children, style }: { children?: unknown; style?: object }) =>
            React.createElement(View, { style }, children),
    }
})

jest.mock("expo-image", () => {
    const React = require("react")
    const { View } = require("react-native")

    return {
        Image: ({ style, testID }: { style?: object; testID?: string }) =>
            React.createElement(View, { style, testID: testID ?? "mock-expo-image" }),
    }
})

jest.mock("expo-image-picker", () => ({
    CameraType: {
        back: "back",
    },
    getMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
    launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
    getCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
    launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}))

jest.mock("expo-image-manipulator", () => ({
    SaveFormat: {
        PNG: "png",
        WEBP: "webp",
        JPEG: "jpeg",
    },
    manipulateAsync: jest.fn(async (uri: string) => ({ uri })),
}))

jest.mock("@react-navigation/elements", () => {
    const actual = jest.requireActual("@react-navigation/elements")

    return {
        ...actual,
        useHeaderHeight: () => 0,
    }
})

jest.mock("@/src/notifications/PushNotificationsProvider", () => ({
    __esModule: true,
    default: ({ children }: { children?: unknown }) => children,
}))

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), { virtual: true })
