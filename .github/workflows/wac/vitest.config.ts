import { defineConfig } from "vitest/config";

// Unit tests of the workflow code: `yarn vitest run --config .github/workflows/wac/vitest.config.ts`.
export default defineConfig({
    test: {
        root: import.meta.dirname,
        include: ["**/__tests__/**/*.test.ts"]
    }
});
