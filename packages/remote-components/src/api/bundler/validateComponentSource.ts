import type { ValidationResult } from "./types.js";

const IMPORT_PATTERN = /^\s*(import\s+|import\()/m;
const REQUIRE_PATTERN = /\brequire\s*\(/;
const DEFAULT_EXPORT_PATTERN = /export\s+default\s+function\b/;
const MANIFEST_EXPORT_PATTERN = /export\s+const\s+manifest\s*=/;
const MANIFEST_NAME_PATTERN = /name\s*:\s*["'`]/;

export function validateComponentSource(source: string): ValidationResult {
    const errors: string[] = [];

    if (IMPORT_PATTERN.test(source)) {
        errors.push(
            "Source must not contain import statements. All dependencies are provided via the runtime SDK."
        );
    }

    if (REQUIRE_PATTERN.test(source)) {
        errors.push(
            "Source must not contain require() calls. All dependencies are provided via the runtime SDK."
        );
    }

    if (!DEFAULT_EXPORT_PATTERN.test(source)) {
        errors.push(
            "Source must have a default export function (e.g., `export default function MyComponent(props) { ... }`)."
        );
    }

    if (!MANIFEST_EXPORT_PATTERN.test(source)) {
        errors.push(
            "Source must export a `manifest` constant (e.g., `export const manifest = { name: ..., inputs: [...] }`)."
        );
    }

    if (MANIFEST_EXPORT_PATTERN.test(source) && !MANIFEST_NAME_PATTERN.test(source)) {
        errors.push("The manifest must include a `name` property.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
