import type { ICanUseFolderLevelPermissions } from "./ICanUseFolderPermissions.js";
import type { IGetIdentityGateway } from "~/flp/FolderLevelPermissions/gateways/index.js";
import type { IGetWcpGateway } from "~/flp/FolderLevelPermissions/gateways/GetWcpGateway/index.js";

export class CanUseFolderLevelPermissions implements ICanUseFolderLevelPermissions {
    private getWcpGateway: IGetWcpGateway;
    private readonly getIdentityGateway: IGetIdentityGateway;

    constructor(getWcpGateway: IGetWcpGateway, getIdentityGateway: IGetIdentityGateway) {
        this.getWcpGateway = getWcpGateway;
        this.getIdentityGateway = getIdentityGateway;
    }

    execute(enabled?: boolean) {
        if (enabled === false) {
            return false;
        }

        const identity = this.getIdentityGateway.execute();

        // FLPs only work with authenticated identities (logged-in users).
        if (!identity) {
            return false;
        }

        // At the moment, we only want FLP to be used with identities of type "admin".
        // This temporarily addresses the issue of API keys not being able to access content, because
        // FLPs doesn't work with them. Once we start adding FLPs to API keys, we can remove this check.
        if (identity.type !== "admin") {
            return false;
        }

        return this.getWcpGateway.execute().canUseFolderLevelPermissions();
    }
}
