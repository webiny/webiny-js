// @flow
import { api } from "./../../index";
import _ from "lodash";

const checkScope = (selectionSet, scopesList, parentFields = "") => {
    selectionSet.selections.forEach(selection => {
        if (selection.kind === "Field") {
            const fieldName = selection.name.value;

            let hasAccess = fieldName === "__typename";
            if (hasAccess) {
                return true;
            }

            const fullPath = parentFields ? `${parentFields}.${fieldName}` : fieldName;
            scopesList.forEach(scope => {
                if (_.get(scope, fullPath)) {
                    hasAccess = true;
                    if (selection.selectionSet) {
                        checkScope(selection.selectionSet, scopesList, fullPath);
                    }
                    return false;
                }
            });

            if (!hasAccess) {
                throw Error(`Not authorized to access "${fullPath}" field.`);
            }
        }
    });
};

/**
 * Authorization middleware.
 * Checks if request identity is authorized to execute the matched API method.
 *
 * @param {Api} context.app
 */
export default async (context: Object) => {
    // Let's allow IntrospectionQuery to be accessed.
    if (_.get(context.graphql, "documentAST.definitions.0.name.value") === "IntrospectionQuery") {
        return;
    }

    const security = api.services.get("security");
    const permissions = security.getIdentity(true);

    // If all enabled (eg. super-admin), return immediately, no need to do further checks.
    const superAdminPermissions = _.get(permissions, "api.*", []);
    if (superAdminPermissions.includes(true)) {
        return;
    }

    for (let i = 0; i < context.graphql.documentAST.definitions.length; i++) {
        let operationDefinition = context.graphql.documentAST.definitions[i];

        for (let j = 0; j < operationDefinition.selectionSet.selections.length; j++) {
            let selection = operationDefinition.selectionSet.selections[j];
            if (selection.kind === "Field") {
                const fieldName = selection.name.value;

                const fieldScopes = _.get(permissions, `api.${fieldName}`) || [];

                let hasAccess = false;
                fieldScopes.forEach(fieldScope => {
                    if (fieldScope === true || fieldScope instanceof Object) {
                        hasAccess = true;
                        return false;
                    }
                });

                if (!hasAccess) {
                    throw Error(`Not authorized to access "${fieldName}" operation.`);
                }

                if (selection.selectionSet) {
                    checkScope(selection.selectionSet, fieldScopes);
                }
            }
        }
    }
};
