import { matcher } from "matcher";
import type { Document } from "@webiny/website-builder-sdk";
import type { IMetadata, Metadata } from "./IMetadata.js";

export class ElementMetadata implements IMetadata {
    private readonly elementId: string;
    private readonly metadata: Record<string, any>;

    constructor(elementId: string, metadata: Record<string, any> = {}) {
        this.elementId = elementId;
        this.metadata = metadata;
    }

    get<T = unknown>(id: string): T | undefined {
        return this.metadata[id];
    }

    set(id: string, data: Metadata): void {
        this.metadata[id] = data;
    }

    unset(id: string): void {
        // Support wildcard paths using micromatch
        if (id.includes("*")) {
            const keys = Object.keys(this.metadata);
            const matches = matcher(keys, id);
            for (const key of matches) {
                delete this.metadata[key];
            }
        } else {
            delete this.metadata[id];
        }
    }

    applyToDocument(document: Document) {
        const current = document.bindings[this.elementId].metadata;
        if (current && current !== this.metadata) {
            // Merge rather than replace: when multiple inputs on the same
            // element each hold a stale metadata snapshot (produced by toJS()
            // in useBindingsForElement), a plain assignment would discard keys
            // written by earlier onChange callbacks.
            Object.assign(current, this.metadata);
        } else {
            document.bindings[this.elementId].metadata = this.metadata;
        }
    }
}
