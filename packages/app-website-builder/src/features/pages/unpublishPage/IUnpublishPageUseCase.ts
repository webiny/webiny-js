import type { WbLocation } from "~/types.js";
import type { WbStatus } from "~/constants.js";

export interface UnpublishPageParams {
    id: string;
    entryId: string;
    status: WbStatus;
    location: WbLocation;
    properties?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface IUnpublishPageUseCase {
    execute: (params: UnpublishPageParams) => Promise<void>;
}
