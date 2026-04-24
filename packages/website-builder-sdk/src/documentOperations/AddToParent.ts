import type { Document, DocumentElement } from "~/types.js";
import type { IDocumentOperation } from "./IDocumentOperation.js";
import { $addElementReferenceToParent } from "./$addElementReferenceToParent.js";

export class AddToParent implements IDocumentOperation {
    private element: DocumentElement;
    private readonly index?: number;

    constructor(element: DocumentElement, index?: number) {
        this.element = element;
        this.index = index;
    }

    apply(document: Document) {
        $addElementReferenceToParent(document, {
            elementId: this.element.id,
            parentId: this.element.parent!.id,
            slot: this.element.parent!.slot,
            index: this.index
        });
    }
}
