GitHub repo: https://github.com/chsanden/appdev/tree/main/FastNotes

# FastNotes

This project is an Expo React Native note-taking app built for a SWE assignment submission. It supports:

- Email/password authentication with Supabase Auth
- Creating, viewing, editing, and deleting notes
- Separate "My Notes" and "Work Notes" lists
- Optional image upload for notes using Supabase Storage
- Remote push notifications through Expo, with a realtime-driven local notification fallback when push registration is unavailable

## Requirements

To build and run this project locally, you need:

- Node.js (LTS recommended)
- npm
- Deno (only required if you want to run `npm run typecheck:functions`)
- Expo Go on a physical device, or an Android/iOS emulator
- A Supabase project that you configure yourself

The repository does not include a committed `.env` file. That is intentional. The app reads runtime values from your local untracked `.env` through `app.config.js`, so anyone running this project must create their own `.env` file with their own Supabase and Expo values.

## Installation

1. Clone or extract the project.
2. Open a terminal in the project root.
3. Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root and define the following variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_EAS_PROJECT_ID=your_expo_eas_project_id
```

Notes:

- `EXPO_PUBLIC_SUPABASE_URL` is the URL of your Supabase project.
- `EXPO_PUBLIC_SUPABASE_KEY` is the public anonymous key for your Supabase project.
- `EXPO_PUBLIC_EAS_PROJECT_ID` is used for Expo push notification registration and related build/push flows.
- The app requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` at runtime. If those two values are missing, the app will not start correctly.
- These values are injected into Expo config by `app.config.js`.

## Build And Run Instructions

Start the Expo development server:

```bash
npm start
```

You can also start a specific platform directly:

```bash
npm run android
npm run ios
npm run web
```

After the development server starts:

- Scan the QR code with Expo Go on a physical device, or
- Open the app in an emulator/simulator

## Test And Validation Commands

Run the Jest test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run linting:

```bash
npm run lint
```

Run TypeScript checks for the app:

```bash
npm run typecheck
```

Run type checks for the included Supabase Edge Function:

```bash
npm run typecheck:functions
```

## Supabase Configuration Expected By The App

This app is not fully standalone. It expects your Supabase project to already contain the database tables and storage resources used by the code.

### 1. Auth

The app uses Supabase Auth with email/password sign-up and login.

### 2. `profiles` table

The app expects a `profiles` table that stores user profile information. Based on the code, it uses these columns:

- `id`
- `email`
- `username`
- `full_name`

The app upserts into `profiles` when a user signs up or when an authenticated session is restored.

### 3. `Notes` table

The app expects a table named `Notes` with this exact capitalization. Based on the code, it uses these columns:

- `id`
- `created_by`
- `title`
- `content`
- `created_at`
- `updated_at`
- `image_url`
- `image_path`
- `image_mime_type`
- `image_size_bytes`

Application behavior assumes:

- Each note belongs to a user through `created_by`
- Users can create notes
- Users can edit and delete only their own notes
- Notes are ordered by `updated_at` and `created_at`

### 4. Storage bucket

The app expects a public Supabase Storage bucket named:

```text
note-images
```

This bucket is used to upload note images. Stored image paths are then saved in the `Notes` table.

Images are validated and processed by the app with these constraints:

- Allowed formats: PNG, JPG/JPEG, WEBP
- Maximum size after processing: 15 MB
- Large images may be resized/compressed before upload

### 5. `user_push_tokens` table

For push notifications, the app expects a table named `user_push_tokens` with fields used for registering device tokens. Based on the code, it uses:

- `installation_id`
- `user_id`
- `push_token`
- `platform`
- `is_active`
- `updated_at`

## Notifications

The app has two notification paths:

### 1. Remote push notifications

On supported native builds, the app requests notification permission, obtains an Expo push token, and stores it in `user_push_tokens`.

This path depends on:

- A valid `EXPO_PUBLIC_EAS_PROJECT_ID`
- A physical device
- Notification permissions being granted

Important limitation:

- Android push notifications are currently not supported in Expo Go. To test Android push behavior, you need a development build or another native build type instead of Expo Go.

### 2. Realtime local-notification fallback

If push registration is unavailable, the app falls back to listening for new `Notes` inserts through Supabase Realtime and schedules a local notification on-device instead.

This fallback can happen when:

- The app is running on a simulator or emulator
- The Expo push project ID is missing
- Push token registration fails for another reason

## Supabase Edge Function

This repository includes a Supabase Edge Function at:

```text
supabase/functions/push/index.ts
```

That function is responsible for sending remote push notifications when notes are created.

If you want to use that function, your Supabase function environment will need its own server-side values, including:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EXPO_ACCESS_TOKEN=your_expo_access_token
```

Notes:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required by the function code.
- `EXPO_ACCESS_TOKEN` may be needed depending on how you configure Expo push notification delivery.
- The function must be connected to a database webhook that sends `POST` requests for `INSERT` events on the `Notes` table.

## Important Submission Note

Because `.env` is intentionally ignored by Git, this submission does not include a committed working local backend configuration. To run the project successfully, the evaluator must create their own `.env` file and connect the app to their own Supabase project configured with the expected tables, columns, storage bucket, and notification setup described above.
