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
            if (!_.get(scopesList, fullPath)) {
                throw Error(`Not authorized to access "${fullPath}" field.`);
            }

            if (selection.selectionSet) {
                checkScope(selection.selectionSet, scopesList, fullPath);
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
    const security = api.services.get("security");
    if (security.config.enabled === false) {
        return;
    }

    // Let's allow IntrospectionQuery to be accessed.
    if (_.get(context.graphql, "documentAST.definitions.0.name.value") === "IntrospectionQuery") {
        if (security.config.enableGraphqlIntrospectionQuery === false) {
            throw Error(`GraphQL introspection query not allowed.`);
        }
        return;
    }

    const permissions = security.getIdentity(true);

    // If all enabled (eg. super-admin), return immediately, no need to do further checks.
    if (permissions.api && permissions.api === "*") {
        return;
    }

    for (let i = 0; i < context.graphql.documentAST.definitions.length; i++) {
        let operationDefinition = context.graphql.documentAST.definitions[i];

        for (let j = 0; j < operationDefinition.selectionSet.selections.length; j++) {
            let selection = operationDefinition.selectionSet.selections[j];
            if (selection.kind === "Field") {
                const fieldName = selection.name.value;

                const fieldPermissions = _.get(permissions, `api.${fieldName}`);
                if (!(fieldPermissions === true || fieldPermissions instanceof Object)) {
                    throw Error(`Not authorized to access "${fieldName}" operation.`);
                }

                if (selection.selectionSet) {
                    checkScope(selection.selectionSet, fieldPermissions);
                }
            }
        }
    }
};
