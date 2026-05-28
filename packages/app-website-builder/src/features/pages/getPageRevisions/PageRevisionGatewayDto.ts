import type { WbStatus } from "~/constants.js";
import type { WbIdentity } from "~/types.js";

export interface PageRevisionGatewayDto {
    id: string;
    entryId: string;
    version: number;
    title: string;
    status: WbStatus;
    savedOn: string;
    locked: boolean;
    createdBy: WbIdentity;
    createdOn: string;
    revisionDescription: string | undefined;
}
