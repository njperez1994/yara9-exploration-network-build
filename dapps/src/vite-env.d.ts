/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_RPC_URL?: string;
  readonly VITE_SUI_NETWORK?: string;
  readonly VITE_STORAGE_OBJECT_ID?: string;
  readonly VITE_SUI_GRAPHQL_ENDPOINT?: string;
  readonly VITE_EVE_WORLD_PACKAGE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
