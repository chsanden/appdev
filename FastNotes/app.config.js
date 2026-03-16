import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  },
});
