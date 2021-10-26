// @ts-nocheck
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";
import { CmsContext } from "~/types";

export class InternalAuthorizationPlugin extends AuthorizationPlugin {
    private _identityType: string;

    constructor(identityType: string) {
        super();

        this._identityType = identityType;
    }

    getPermissions(context: CmsContext) {
        const identity = context.security.getIdentity();

        if (!identity || identity.type !== this._identityType) {
            return;
        }

        // Return permissions we defined in the authentication plugin.
        return identity.permissions;
    }
}
