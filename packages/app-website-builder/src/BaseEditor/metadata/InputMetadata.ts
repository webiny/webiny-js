import type { Document } from "~/sdk/types";
import type { IMetadata } from "./IMetadata";

export class InputMetadata implements IMetadata {
    private readonly inputId: string;
    private metadata: IMetadata;
    private prefix = "inputs/";

    constructor(inputId: string, metadata: IMetadata) {
        this.inputId = inputId;
        this.metadata = metadata;
    }

    applyToDocument(document: Document): void {
        this.metadata.applyToDocument(document);
    }

    get<T = unknown>(id: string): T | undefined {
        return this.metadata.get(`${this.prefix}${this.inputId}/${id}`);
    }

    set(id: string, data: any): void {
        this.metadata.set(`${this.prefix}${this.inputId}/${id}`, data);
    }

    unset(id: string = "*"): void {
        this.metadata.unset(`${this.prefix}${this.inputId}/${id}`);
    }
}
