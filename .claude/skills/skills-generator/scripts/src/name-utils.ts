/**
 * Shared name utilities for parsing PascalCase class names
 * into kebab-case skill names, title-case human names, etc.
 */

/** Split a PascalCase string into words: "EntryBeforeCreate" → ["Entry", "Before", "Create"] */
export function splitPascalCase(str: string): string[] {
  // Split on transitions: lowercase→uppercase, uppercase→uppercase+lowercase, or letter→digit
  return str
    .replace(/([a-z])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split("\0");
}

/** Convert PascalCase or words to kebab-case: "EntryBeforeCreate" → "entry-before-create" */
export function toKebabCase(str: string): string {
  return splitPascalCase(str)
    .map(w => w.toLowerCase())
    .join("-");
}

/** Convert kebab-case to Title Case: "entry-before-create" → "Entry Before Create" */
export function toTitleCase(kebab: string): string {
  return kebab
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Convert PascalCase to Title Case: "EntryBeforeCreate" → "Entry Before Create" */
export function pascalToTitleCase(str: string): string {
  return splitPascalCase(str).join(" ");
}
