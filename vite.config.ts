import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const repoName = "family-health-ledger";
const isGithubPages = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: isGithubPages ? `/${repoName}/` : "/",
  plugins: [react()],
});
