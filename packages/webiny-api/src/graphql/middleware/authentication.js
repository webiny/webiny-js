// @flow
import { app } from "webiny-api";
import _ from "lodash";

export default async (params: Object) => {
    const { req } = params;

    // Append security data to current request.
    req.security = {
        sudo: false,
        identity: null,
        permissions: {}
    };

    // Let's merge default permissions.
    const security = await app.services.get("security");
    req.security.permissions = _.cloneDeep(security.getDefaultPermissions());

    const token =
        typeof app.config.security.header === "function"
            ? app.config.security.token(req)
            : req.get(app.config.security.header || "Authorization");

    if (!token) {
        return;
    }

    await security.sudo(async () => {
        // Assigns identity retrieved from received token.
        const identity = await security.verifyToken(token);

        // If we have identity, let's merge its permissions and default ones.
        if (identity) {
            req.security.identity = identity;

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
                    if (!req.security.permissions.entities[entityName]) {
                        req.security.permissions.entities[entityName] = [];
                    }
                    req.security.permissions.entities[entityName].push(
                        policyEntitiesPermissions[entityName]
                    );
                }

                const policyApiPermissions = _.get(policy, "permissions.api", {});
                for (let operationName in policyApiPermissions) {
                    if (!req.security.permissions.api[operationName]) {
                        req.security.permissions.api[operationName] = [];
                    }
                    req.security.permissions.api[operationName].push(
                        policyApiPermissions[operationName]
                    );
                }
            });
        }
    });
};
