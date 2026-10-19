/*
 * The names a generated field renderer can use without importing anything. Defined once: the API
 * wraps stored source so these are in scope, the admin hands in a value for each, and the tool
 * description lists them. A name added or removed here changes what stored source may rely on, so
 * it needs an `ADMIN_EXTENSION_RUNTIME_VERSION` bump.
 */
export const FIELD_RENDERER_RUNTIME_NAMES = [
    "React",
    "createFieldRenderer",
    "Input",
    "Textarea",
    "Text",
    "Heading",
    "Button",
    "Switch",
    "Checkbox",
    "Select",
    "Tag",
    "Alert",
    "Separator",
    "DelayedOnChange"
] as const;

export type FieldRendererRuntimeName = (typeof FIELD_RENDERER_RUNTIME_NAMES)[number];

export type FieldRendererRuntime = Record<FieldRendererRuntimeName, unknown>;

/** The variable a compiled renderer assigns its exports to. */
export const FIELD_RENDERER_GLOBAL_NAME = "__adminExtensionFieldRenderer__";

/** CMS field types a generated renderer may target. */
export const FIELD_RENDERER_FIELD_TYPES = ["text", "long-text", "number", "boolean"] as const;

export type FieldRendererFieldType = (typeof FIELD_RENDERER_FIELD_TYPES)[number];

/** The name the CMS field editor offers, and that a model field stores in `renderer.name`. */
export function toCmsRendererName(extensionName: string): string {
    return `admin-extension-${extensionName}`;
}
