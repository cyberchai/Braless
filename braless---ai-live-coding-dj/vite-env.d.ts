/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_API_URL?: string;
  readonly VITE_MONGODB_DATA_API_URL?: string;
  readonly VITE_MONGODB_DATA_API_KEY?: string;
  readonly VITE_MONGODB_CLUSTER_NAME?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

