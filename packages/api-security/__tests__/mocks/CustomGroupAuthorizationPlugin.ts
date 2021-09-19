import { Config, GroupAuthorizationPlugin } from "~/plugins/GroupAuthorizationPlugin";
import { Security } from "~/Security";
import { SecurityPermission } from "~/types";

export interface CustomConfig extends Config {
    fullAccess: boolean;
}

export class CustomGroupAuthorizationPlugin extends GroupAuthorizationPlugin<CustomConfig> {
    async getPermissions(security: Security): Promise<null | SecurityPermission[]> {
        if (this.config.fullAccess) {
            return [{ name: "*" }];
        }

        const identity = security.getIdentity();
        if (identity && identity["group"] === "full-access") {
            return [{ name: "*" }];
        }

        return super.getPermissions(security);
    }
}
