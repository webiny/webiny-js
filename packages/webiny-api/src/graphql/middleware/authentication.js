// @flow
import { api } from "./../../index";
import _ from "lodash";

export default async (context: Object) => {
    // Append security data to current request.
    context.security = {
        sudo: false,
        identity: null,
        permissions: {}
    };

    // Let's merge default permissions.
    const security = await api.services.get("security");
    context.security.permissions = _.cloneDeep(security.getDefaultPermissions());

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

            identityPolicies.forEach(policy => {
                const policyEntitiesPermissions = _.get(policy, "permissions.entities", {});
                for (let entityName in policyEntitiesPermissions) {
                    if (!context.security.permissions.entities[entityName]) {
                        context.security.permissions.entities[entityName] = [];
                    }
                    context.security.permissions.entities[entityName].push(
                        policyEntitiesPermissions[entityName]
                    );
                }

                const policyApiPermissions = _.get(policy, "permissions.api", {});
                for (let operationName in policyApiPermissions) {
                    if (!context.security.permissions.api[operationName]) {
                        context.security.permissions.api[operationName] = [];
                    }
                    context.security.permissions.api[operationName].push(
                        policyApiPermissions[operationName]
                    );
                }
            });
        }
    });
};
