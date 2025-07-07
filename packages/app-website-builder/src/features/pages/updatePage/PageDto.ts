import type { WbLocation } from "~/types.js";
import type { WbStatus } from "~/constants.js";

export interface PageDto {
    id: string;
    entryId: string;
    status: WbStatus;
    wbyAco_location: WbLocation;
    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: Record<string, any>;
}
