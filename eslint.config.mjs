import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import lodash from "eslint-plugin-lodash";
import _import from "eslint-plugin-import";
import vitest from "@vitest/eslint-plugin";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

function getNoUnusedVars() {
  if ("ESLINT_NO_UNUSED_VARS" in process.env) {
    return parseInt(process.env["ESLINT_NO_UNUSED_VARS"]);
  }
  return 1;
}

export default defineConfig([
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
      import: _import,
      vitest,
    },
    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      //"plugin:vitest/recommended"
    ),
    rules: {
      "react/prop-types": 0,
      "import/no-unresolved": 0,
      "@typescript-eslint/no-namespace":"off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-ts-comment": [
        2,
        {
          "ts-check": true,
          "ts-ignore": "allow-with-description",
          "ts-nocheck": "allow-with-description",
          "ts-expect-error": false,
        },
      ],
      "@typescript-eslint/no-restricted-types": "error",
      "@typescript-eslint/no-use-before-define": 0,
      "@typescript-eslint/no-unused-vars": getNoUnusedVars(),
      "@typescript-eslint/no-var-requires": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      curly: ["error"],
      "@vitest/expect-expect": 0,
      "@vitest/no-conditional-expect": 0,
      "@vitest/no-commented-out-tests": 0,
      "@vitest/no-disabled-tests": 0,
      "lodash/import-scope": [2, "method"],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@aws-sdk/*"],
              message: "Please use @webiny/aws-sdk instead.",
            },
          ],
        },
      ],
      "import/dynamic-import-chunkname": [
        2,
        {
          importFunctions: ["dynamicImport"],
          allowEmpty: false,
        },
      ],
      /**
       * Example of code: onOpen && onOpen();
       * Basically, this is instead of an if statement.
       */
      "@typescript-eslint/no-unused-expressions": "off",
    },
    settings: {
      react: {
        version: "18.2.0",
      },
    },
  },
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
      import: _import,
      vitest,
    },
    extends: compat.extends(
      "plugin:react/recommended",
      //"plugin:vitest/recommended"
    ),
    rules: {
      "react/prop-types": 0,
      "lodash/import-scope": [2, "method"],
      "import/no-unresolved": 0,
      "@vitest/expect-expect": 0,
      "@vitest/no-conditional-expect": 0,
      "@vitest/no-commented-out-tests": 0,
      "@vitest/no-disabled-tests": 0,
      "import/dynamic-import-chunkname": [
        2,
        {
          importFunctions: ["dynamicImport"],
          allowEmpty: false,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@aws-sdk/*"],
              message: "Please use @webiny/aws-sdk instead.",
            },
          ],
        },
      ],
    },
    settings: {
      react: {
        version: "18.2.0",
      },
    },
  },
  {
    files: ["packages/aws-sdk/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  globalIgnores([
    ".idea/**/*",
    ".nx/**/*",
    ".yarn/**/*",
    ".webiny/**/*",
    "**/node_modules/",
    "**/dist/",
    "**/lib/",
    "**/build/",
    "**/.out/",
    "**/*.d.ts",
    "idea.js",
    "scripts/**/*.js",
    "packages/admin-ui/.storybook/**/*",
    "packages/create-webiny-project/**/*",
    "packages/create-webiny-project/_templates/**/*",
  ]),
]);
