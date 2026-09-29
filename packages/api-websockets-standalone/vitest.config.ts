import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        include: ["__tests__/**/*.test.ts"]
    },
    resolve: {
        alias: {
            "~": resolve(import.meta.dirname, "src"),
            "~tests": resolve(import.meta.dirname, "__tests__")
        }
    }
});
