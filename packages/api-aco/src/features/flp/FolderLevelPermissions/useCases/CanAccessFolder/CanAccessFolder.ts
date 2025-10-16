import type { CanAccessFolderParams, ICanAccessFolder } from "./ICanAccessFolder.js";
import type { IGetIdentityGateway } from "../../gateways/index.js";

export class CanAccessFolder implements ICanAccessFolder {
    private getIdentityGateway: IGetIdentityGateway;

    constructor(getIdentityGateway: IGetIdentityGateway) {
        this.getIdentityGateway = getIdentityGateway;
    }

    async execute({ permissions = [], rwd, managePermissions }: CanAccessFolderParams) {
        if (!permissions.length) {
            return true;
        }

        const identity = this.getIdentityGateway.execute();
        const currentIdentityPermission = permissions.find(p => {
            return p.target === `admin:${identity.id}`;
        });

        if (!currentIdentityPermission) {
            return false;
        }

        const { level } = currentIdentityPermission;

        if (managePermissions) {
            return level === "owner";
        }

        // If the user has a `no-access` level, they are explicitly denied access to the current folder.
        if (level === "no-access") {
            return false;
        }

        // Checking for "write" or "delete" access. Allow only if the
        // user is has `owner` or `editor` level or the folder is public (no FLP assigned).
        if (rwd !== "r") {
            return level === "owner" || level === "editor" || level === "public";
        }

        return true;
    }
}
