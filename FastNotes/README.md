#Requirements

   Node.js (LTS recommended)
   npm (comes with Node.js)
   Expo CLI (used via npx command)
   Expo Go (for running on device / emulator)

#Installation

   1. Extract folder
   2. Open terminal in project root (where you find 'package.json')
   3. Install dependencies:
   ```bash
   npm install
   ```

#Running the project

   Start Expo dev server:
   ```bash
   npx expo start
   ```

   Then:
      - Scan the QR code using Expo Go app on mobile device
      **or**
      - Run the app in an emulator from the Expo developer tools

#Running tests

   Run the Jest test suite from the project root:
   ```bash
   npm test
   ```

   Run each test file one by one:
   ```bash
   npx jest __tests__/detail-screen.test.tsx
   npx jest __tests__/auth-guard.test.tsx
   npx jest __tests__/new-note.test.tsx
   ```

