import type { WbIdentity, WbLocation } from "~/types";
import type { WbStatus } from "~/constants.js";

export interface PageGatewayDto {
    id: string;
    entryId: string;
    status: WbStatus;
    wbyAco_location: WbLocation;
    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: Record<string, any>;
    createdBy: WbIdentity;
    createdOn: string;
    savedBy: WbIdentity;
    savedOn: string;
    modifiedBy: WbIdentity | null;
    modifiedOn: string | null;
}
