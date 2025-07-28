import type { WbIdentity, WbLocation } from "~/types";
import { Redirect } from "~/domain/Redirect/index.js";

export interface RedirectDto {
    id: string;
    location: WbLocation;
    createdBy: WbIdentity;
    createdOn: string;
    savedBy: WbIdentity;
    savedOn: string;
    modifiedBy: WbIdentity;
    modifiedOn: string;
}

export class RedirectDtoMapper {
    static toDTO(redirect: Redirect): RedirectDto {
        return {
            id: redirect.id,
            location: redirect.location,
            createdBy: redirect.createdBy,
            createdOn: redirect.createdOn,
            savedBy: redirect.savedBy,
            savedOn: redirect.savedOn,
            modifiedBy: redirect.modifiedBy,
            modifiedOn: redirect.modifiedOn
        };
    }
}
