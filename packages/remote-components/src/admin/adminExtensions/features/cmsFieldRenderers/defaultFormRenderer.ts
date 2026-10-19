import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";

/** The form renderer the CMS uses by default for a field of this shape. */
export function defaultFormRenderer(config: FieldRendererConfig): string {
    switch (config.fieldType) {
        case "text":
            return config.multipleValues ? "textInputs" : "textInput";
        case "long-text":
            return config.multipleValues ? "textareas" : "textarea";
        case "number":
            return config.multipleValues ? "numberInputs" : "numberInput";
        case "boolean":
            return "switch";
    }
}
