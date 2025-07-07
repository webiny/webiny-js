import type { JsonPatchOperation } from "~/sdk/jsonPatch";
import type { Document, DocumentElementBindings } from "~/sdk/types";

export interface IBindingsUpdater {
    applyToDocument(document: Document): void;
    createJsonPatch(bindings: DocumentElementBindings): JsonPatchOperation[];
}
