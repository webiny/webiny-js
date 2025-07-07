import type { WbLocation } from "~/types.js";

export interface PageDto {
    wbyAco_location: WbLocation;
    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: Record<string, any>;
}
