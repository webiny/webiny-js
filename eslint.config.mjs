import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import lodash from "eslint-plugin-lodash";
import vitest from "@vitest/eslint-plugin";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

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
  // --------------------
  // Base config (packages, testing, cypress)
  // --------------------
  {
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.commonjs,
        window: true,
        document: true,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react,
      lodash,
      "@vitest": vitest,
      import: fixupPluginRules(_import),
    },
    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended"
      // you can add "plugin:@vitest/legacy-recommended" if needed
    ),
    rules: {
      "react/prop-types": 0,
      "import/no-unresolved": 0,
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
      "@typescript-eslint/no-use-before-define": 0,
      "@typescript-eslint/no-unused-vars": getNoUnusedVars(),
      "@typescript-eslint/no-var-requires": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
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
        { importFunctions: ["dynamicImport"], allowEmpty: false },
      ],
    },
    settings: {
      react: { pragma: "React", version: "detect" },
    },
  },
  // --------------------
  // JS-only override for packages
  // --------------------
  {
    files: ["packages/**/*.js", "packages/**/*.cjs", "packages/**/*.jsx"],
    languageOptions: {
      parser: undefined, // do not use TS parser for JS
      globals: {
        ...globals.node,
        ...globals.commonjs,
        window: true,
        document: true,
      },
    },
    plugins: {
      react,
      import: fixupPluginRules(_import),
      lodash,
    },
    rules: {
      "no-unused-vars": 1,
      "no-undef": 2,
      "react/prop-types": 1,
      "lodash/import-scope": [2, "method"],
      "import/no-unresolved": 0,
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@aws-sdk/*"],
              message: "Please use @webiny/aws-sdk instead."
            }
          ]
        }
      ],
    },
    settings: {
      react: {
        pragma: "React",
        version: "detect",
      },
    },
  },
  
  // --------------------
  // Scripts override
  // --------------------
  {
    files: ["scripts/**/*.ts", "scripts/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json", // root tsconfig.json
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
  },
  
  // --------------------
  // Ignore files
  // --------------------
  globalIgnores([
    ".webiny/**/*",
    ".nx/**/*",
    ".yarn/**/*",
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
