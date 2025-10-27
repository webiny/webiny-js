import { createContextPlugin } from "@webiny/api";
import type { GroupsTeamsAuthorizerConfig } from "@webiny/api-security";
import { createGroupsTeamsAuthorizer } from "@webiny/api-security";
import { ExternalIdpUserSyncFeature } from "@webiny/api-admin-users/features/ExternalIdpUserSync";
import type { AuthenticatorConfig } from "~/createAuthenticator.js";
import { createAuthenticator } from "~/createAuthenticator.js";
import { createIdentityType } from "~/createIdentityType.js";
import { extendTenancy } from "./extendTenancy.js";

import type { Context } from "~/types.js";

export interface CreateOktaConfig<TContext extends Context = Context>
    extends AuthenticatorConfig,
        GroupsTeamsAuthorizerConfig<TContext> {
    graphQLIdentityType?: string;
}

export const createOkta = <TContext extends Context = Context>(
    config: CreateOktaConfig<TContext>
) => {
    const identityType = config.identityType || "admin";
    const graphQLIdentityType = config.graphQLIdentityType || "OktaIdentity";

    return [
        createAuthenticator({
            issuer: config.issuer,
            getIdentity: config.getIdentity
        }),
        createGroupsTeamsAuthorizer<TContext>({
            identityType
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy(),
        createContextPlugin(context => {
            ExternalIdpUserSyncFeature.register(context.container);
        })
    ];
};
