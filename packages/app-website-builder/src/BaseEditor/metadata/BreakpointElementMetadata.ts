import type { Document } from "~/sdk/types";
import type { IMetadata } from "./IMetadata";

export class BreakpointElementMetadata implements IMetadata {
    private readonly breakpoints: string[];
    private readonly currentBreakpoint: string;
    private metadata: IMetadata;

    constructor(breakpoints: string[], currentBreakpoint: string, metadata: IMetadata) {
        this.breakpoints = breakpoints;
        this.currentBreakpoint = currentBreakpoint;
        this.metadata = metadata;
    }

    applyToDocument(document: Document): void {
        this.metadata.applyToDocument(document);
    }

    get<T = unknown>(id: string): T | undefined {
        const upTo = this.breakpoints.indexOf(this.currentBreakpoint);

        for (let i = upTo; i >= 0; i--) {
            const breakpoint = this.breakpoints[i];
            const data = this.metadata.get<T>(`${id}/${breakpoint}`);
            if (data !== undefined) {
                return data;
            }
        }

        return undefined;
    }

    set(id: string, data: any): void {
        this.metadata.set(`${id}/${this.currentBreakpoint}`, data);
    }

    unset(id: string): void {
        this.metadata.unset(`${id}/${this.currentBreakpoint}`);
    }
}
