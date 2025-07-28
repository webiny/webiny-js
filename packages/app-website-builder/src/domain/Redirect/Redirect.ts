import type { WbIdentity, WbLocation } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

export interface RedirectData {
    id?: string;
    location?: WbLocation;
    wbyAco_location?: WbLocation;
    createdBy?: WbIdentity;
    createdOn?: string;
    savedBy?: WbIdentity;
    savedOn?: string;
    modifiedBy?: WbIdentity | null;
    modifiedOn?: string | null;
    redirectFrom?: string;
    redirectTo?: string;
    redirectType?: string;
    isEnabled?: boolean;
}

export class Redirect {
    public id: string;
    public location: WbLocation;
    public createdBy: WbIdentity;
    public createdOn: string;
    public savedBy: WbIdentity;
    public savedOn: string;
    public modifiedBy: WbIdentity;
    public modifiedOn: string;
    public redirectFrom: string;
    public redirectTo: string;
    public redirectType: string;
    public isEnabled: boolean;

    protected constructor(data: RedirectData) {
        this.id = data.id ?? "";
        this.location = this.createLocation(data);
        this.createdBy = this.createIdentity(data.createdBy);
        this.createdOn = data.createdOn ?? "";
        this.savedBy = this.createIdentity(data.savedBy);
        this.savedOn = data.savedOn ?? "";
        this.modifiedBy = this.createIdentity(data.modifiedBy);
        this.modifiedOn = data.modifiedOn ?? "";
        this.redirectFrom = data.redirectFrom ?? "";
        this.redirectTo = data.redirectTo ?? "";
        this.redirectType = data.redirectType ?? "";
        this.isEnabled = data.isEnabled ?? false;
    }

    static create(data: RedirectData) {
        return new Redirect(data);
    }

    private createLocation(data: RedirectData): WbLocation {
        if (data.wbyAco_location) {
            return {
                folderId: data.wbyAco_location.folderId
            };
        }

        if (data.location) {
            return {
                folderId: data.location.folderId
            };
        }

        return {
            folderId: ROOT_FOLDER
        };
    }

    private createIdentity(identity?: WbIdentity | null): WbIdentity {
        return {
            id: identity?.id || "",
            displayName: identity?.displayName || "",
            type: identity?.type || ""
        };
    }
}
