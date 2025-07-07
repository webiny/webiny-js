import micromatch from "micromatch";
import type { Document } from "~/sdk/types";
import type { IMetadata, Metadata } from "./IMetadata";

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
            const matches = micromatch(keys, id);
            for (const key of matches) {
                delete this.metadata[key];
            }
        } else {
            delete this.metadata[id];
        }
    }

    applyToDocument(document: Document) {
        document.bindings[this.elementId].metadata = this.metadata;
    }
}
