import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

function parseFrontendEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        return [key, value];
      }),
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendEnv = parseFrontendEnvFile(
    resolve(process.cwd(), "../frontend.env"),
  );

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL ?? frontendEnv.VITE_SUPABASE_URL ?? "",
      ),
      "import.meta.env.VITE_SUPABASE_ANON_K": JSON.stringify(
        env.VITE_SUPABASE_ANON_K ??
          frontendEnv.VITE_SUPABASE_ANON_K ??
          env.VITE_SUPABASE_ANON_KEY ??
          frontendEnv.VITE_SUPABASE_ANON_KEY ??
          "",
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ??
          frontendEnv.VITE_SUPABASE_ANON_KEY ??
          env.VITE_SUPABASE_ANON_K ??
          frontendEnv.VITE_SUPABASE_ANON_K ??
          "",
      ),
    },
  };
});
