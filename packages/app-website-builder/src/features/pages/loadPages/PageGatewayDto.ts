import type { WbIdentity, WbLocation, WbLive } from "~/types.js";
import type { WbStatus } from "~/constants.js";

export interface PageGatewayDto {
    id: string;
    entryId: string;
    status: WbStatus;
    location: WbLocation;
    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: Record<string, any>;
    createdBy: WbIdentity;
    createdOn: string;
    savedBy: WbIdentity;
    live: WbLive | null;
    savedOn: string;
    modifiedBy: WbIdentity | null;
    modifiedOn: string | null;
}
