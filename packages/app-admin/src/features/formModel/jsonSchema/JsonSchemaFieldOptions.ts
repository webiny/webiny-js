import type { FieldRendererName } from "../abstractions.js";

export interface JsonSchemaFieldOptions {
    /*
     * Renderer per `ui` hint, for a string property whose hint is not `textarea`. A hint with no
     * entry here is a plain text input.
     */
    uiRenderers: Record<string, FieldRendererName<"text", false>>;
}
