import { jsonPatch } from "@webiny/website-builder-sdk";
import type { DocumentElementBindings, JsonPatchOperation } from "@webiny/website-builder-sdk";

interface IBindingsUpdate {
    createJsonPatch(bindings: DocumentElementBindings): JsonPatchOperation[];
}

/**
 * Tracks what the preview currently shows for one element, so preview patches can be computed
 * against it.
 *
 * The preview applies each patch on top of its own copy of the element's bindings. Computing a patch
 * against the committed bindings instead goes wrong as soon as one preview patch has been applied:
 * going back to the committed value (OS undo, or deleting what was just typed) diffs to an empty
 * patch, and the preview keeps showing the last previewed value.
 *
 * The tracked copy is tied to the committed bindings it started from. Once those change, the editor
 * has sent the preview the committed state, so tracking starts over from it.
 */
export class PreviewedBindings {
    private source: DocumentElementBindings | null = null;
    private bindings: DocumentElementBindings | null = null;

    createPatch(update: IBindingsUpdate, committed: DocumentElementBindings): JsonPatchOperation[] {
        const base = this.source === committed && this.bindings ? this.bindings : committed;
        const patch = update.createJsonPatch(base);

        this.source = committed;
        this.bindings = jsonPatch.applyPatch(structuredClone(base), patch, false, true).newDocument;

        return patch;
    }
}
