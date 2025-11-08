import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { CanAccessFolderParams, ICanAccessFolder } from "./ICanAccessFolder.js";

export class CanAccessFolder implements ICanAccessFolder {
    constructor(private identityContext: IdentityContext.Interface) {}

    async execute({ permissions = [], rwd, managePermissions }: CanAccessFolderParams) {
        if (!permissions.length) {
            return true;
        }

        const identity = this.identityContext.getIdentity();
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
