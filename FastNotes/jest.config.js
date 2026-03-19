module.exports = {
  preset: "jest-expo",
  clearMocks: true,
  watchman: false,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-router|@react-navigation/.*|react-native-safe-area-context|react-native-reanimated|react-native-gesture-handler|react-native-screens))",
  ],
};
