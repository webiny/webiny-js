import type {
    CanAccessFolderContentParams,
    ICanAccessFolderContent
} from "./ICanAccessFolderContent.js";
import type { IGetIdentityGateway } from "../../gateways/index.js";

export class CanAccessFolderContent implements ICanAccessFolderContent {
    private getIdentityGateway: IGetIdentityGateway;

    constructor(getIdentityGateway: IGetIdentityGateway) {
        this.getIdentityGateway = getIdentityGateway;
    }

    async execute({ permissions = [], rwd }: CanAccessFolderContentParams) {
        const identity = this.getIdentityGateway.execute();

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
