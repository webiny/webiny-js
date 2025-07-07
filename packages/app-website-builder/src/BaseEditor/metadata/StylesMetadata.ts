import type { Document } from "~/sdk/types";
import type { IMetadata } from "./IMetadata";

export class StylesMetadata implements IMetadata {
    private metadata: IMetadata;
    private prefix = "styles/";

    constructor(metadata: IMetadata) {
        this.metadata = metadata;
    }

    applyToDocument(document: Document): void {
        this.metadata.applyToDocument(document);
    }

    get<T = unknown>(id: string): T | undefined {
        return this.metadata.get(`${this.prefix}${id}`);
    }

    set(id: string, data: any): void {
        this.metadata.set(`${this.prefix}${id}`, data);
    }

    unset(id: string): void {
        this.metadata.unset(`${this.prefix}${id}`);
    }
}
