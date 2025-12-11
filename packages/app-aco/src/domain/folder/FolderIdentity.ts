import type { CmsIdentity } from "@webiny/app-headless-cms-common/types/index.js";

export type FolderIdentityDto = {
    id: string;
    displayName: string;
    type: string;
};

export class FolderIdentity {
    static createEmpty(): FolderIdentityDto {
        return {
            id: "",
            displayName: "",
            type: ""
        };
    }

    static from(identity: CmsIdentity | null | undefined): FolderIdentityDto {
        if (!identity) {
            return FolderIdentity.createEmpty();
        }

        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    }
}
