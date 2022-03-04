// TODO @ts-refactor @pavel
// @ts-nocheck
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";
import { CmsContext } from "~/types";

export class InternalAuthorizationPlugin extends AuthorizationPlugin {
    private readonly _identityType: string;

    public constructor(identityType: string) {
        super();

        this._identityType = identityType;
    }

    public getPermissions(context: CmsContext) {
        const identity = context.security.getIdentity();

        if (!identity || identity.type !== this._identityType) {
            return;
        }

        // Return permissions we defined in the authentication plugin.
        return identity.permissions;
    }
}
