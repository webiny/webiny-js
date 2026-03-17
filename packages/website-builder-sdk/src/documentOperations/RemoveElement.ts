import type { Document } from "~/types.js";
import type { IDocumentOperation } from "./IDocumentOperation.js";

export class RemoveElement implements IDocumentOperation {
    private readonly elementId: string;

    constructor(elementId: string) {
        this.elementId = elementId;
    }

    apply(document: Document) {
        // Recursively remove all descendants first.
        for (const id in document.elements) {
            if (document.elements[id].parent?.id === this.elementId) {
                new RemoveElement(id).apply(document);
            }
        }

        // Remove bindings and the element itself.
        delete document.bindings[this.elementId];
        delete document.elements[this.elementId];
    }
}
