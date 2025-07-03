import type { WbLocation } from "~/types.js";
import type { WbStatus } from "~/constants.js";

export interface DuplicatePageParams {
    id: string;
    entryId: string;
    status: WbStatus;
    location: WbLocation;
    properties?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface IDuplicatePageUseCase {
    execute: (params: DuplicatePageParams) => Promise<void>;
}
