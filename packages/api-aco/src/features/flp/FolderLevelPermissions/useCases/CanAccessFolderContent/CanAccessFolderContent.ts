import type { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type {
    CanAccessFolderContentParams,
    ICanAccessFolderContent
} from "./ICanAccessFolderContent.js";

export class CanAccessFolderContent implements ICanAccessFolderContent {
    constructor(private identityContext: IdentityContext.Interface) {}

    async execute({ permissions = [], rwd }: CanAccessFolderContentParams) {
        const identity = this.identityContext.getIdentity();

        const currentIdentityPermission = permissions.find(p => {
            return p.target === `admin:${identity.id}`;
        });

        if (!currentIdentityPermission) {
            return false;
        }

        const { level } = currentIdentityPermission;

        // If the user has a `no-access` level, they are explicitly denied access to the current folder.
        if (level === "no-access") {
            return false;
        }

        // If the user is not an owner and we're checking for "write" or
        // "delete" access, then we can immediately return false.
        if (rwd !== "r") {
            return level !== "viewer";
        }

        return true;
    }
}
