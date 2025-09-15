import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import lodash from "eslint-plugin-lodash";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Compat helper for older ESLint configs/plugins
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// Helper to control TS no-unused-vars dynamically
function getNoUnusedVars() {
  if ("ESLINT_NO_UNUSED_VARS" in process.env) {
    return parseInt(process.env["ESLINT_NO_UNUSED_VARS"]);
  }
  return 1;
}

export default defineConfig([
  // TypeScript files with type-aware parsing
  {
    files: ["packages/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: resolve(__dirname, "./tsconfig.json"),
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      globals: {
        node: true,
        commonjs: true,
        window: true,
        document: true,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react,
      lodash,
    },
    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended"
    ),
    rules: {
      "@typescript-eslint/no-unused-vars": getNoUnusedVars(),
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      curly: ["error"],
      "react/prop-types": "off",
      "lodash/import-scope": [2, "method"],
    },
  },
  
  // JavaScript files (non-type-aware)
  {
    files: ["packages/**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: { sourceType: "module" },
      globals: {
        node: true,
        commonjs: true,
        window: true,
        document: true,
      },
    },
    plugins: {
      react,
      lodash,
    },
    extends: compat.extends("plugin:react/recommended"),
    rules: {
      "react/prop-types": "off",
      "lodash/import-scope": [2, "method"],
    },
  },
  
  // Global ignore patterns
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/lib/",
    "**/build/",
    "**/.out/",
    "**/*.d.ts",
    "idea.js",
    "scripts/**/*.js",
    "packages/create-webiny-project/utils/binaries/**",
  ]),
]);
