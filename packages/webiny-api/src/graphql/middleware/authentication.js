// @flow
import { api } from "./../../index";
import _ from "lodash";
import mergePermissions from "./../../security/mergePermissions";

export default async (context: Object) => {
    // Append security data to current request.
    context.security = {
        sudo: false,
        identity: null,
        permissions: {}
    };

    // Let's merge default permissions.
    const security = await api.services.get("security");
    context.security.permissions = mergePermissions(
        [context.security.permissions].concat(_.cloneDeep(security.getDefaultPermissions()))
    );

    const token =
        typeof api.config.security.header === "function"
            ? api.config.security.token(context.event)
            : context.event.headers[api.config.security.header || "Authorization"];

    if (!token) {
        return;
    }

    await security.sudo(async () => {
        // Assigns identity retrieved from received token.
        const identity = await security.verifyToken(token);

        // If we have identity, let's merge its permissions and default ones.
        if (identity) {
            context.security.identity = identity;

            let identityPolicies = [];

            // Policies assigned via groups.
            const groups = await identity.groups;
            for (let i = 0; i < groups.length; i++) {
                identityPolicies = identityPolicies.concat(await groups[i].policies);
            }

            // Directly assigned policies.
            identityPolicies = identityPolicies.concat(await identity.policies);

            context.security.permissions = mergePermissions(
                [context.security.permissions].concat(
                    identityPolicies.map(policy => policy.permissions)
                )
            );
        }
    });
};
