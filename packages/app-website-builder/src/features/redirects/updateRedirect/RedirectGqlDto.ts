import type { WbIdentity, WbLocation } from "~/types.js";

export interface RedirectGqlDto {
    id: string;
    wbyAco_location: WbLocation;
    createdBy: WbIdentity;
    createdOn: string;
    savedBy: WbIdentity;
    savedOn: string;
    modifiedBy: WbIdentity | null;
    modifiedOn: string | null;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}
