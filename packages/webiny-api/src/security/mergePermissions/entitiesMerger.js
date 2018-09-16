// @flow
import _ from "lodash";
const ENTITY_PERMISSION_CLASSES = ["owner", "group", "other"];
const ENTITY_CRUD_OPERATIONS = ["create", "read", "update", "delete"];

export default (output: Object, entitiesPermissionsToMerge: Object) => {
    if (output["entities"] === "*") {
        return;
    }

    if (entitiesPermissionsToMerge === "*") {
        output["entities"] = "*";
        return;
    }

    if (!output["entities"]) {
        output["entities"] = {};
    }

    Object.keys(entitiesPermissionsToMerge).forEach(entityClass => {
        const entityClassPermissions = {
            current: output["entities"][entityClass],
            toMerge: entitiesPermissionsToMerge[entityClass]
        };

        if (entityClassPermissions.current === "*") {
            return true;
        }

        if (entityClassPermissions.toMerge === "*") {
            output["entities"][entityClass] = "*";
            return true;
        }

        // Permission classes (owner, group, other).
        ENTITY_PERMISSION_CLASSES.forEach(permissionClass => {
            // If "*" was set for permissions class before, we don't need to merge anything, continue with next.
            if (_.get(entityClassPermissions.current, permissionClass) === "*") {
                return true;
            }

            // If given policy has "*" for permission class, override previous value and continue.
            if (_.get(entityClassPermissions.toMerge, permissionClass) === "*") {
                _.set(output, `entities.${entityClass}.${permissionClass}`, "*");
                return true;
            }

            // Only continue if given policy has allowed operations defined in an array, otherwise continue.
            if (!Array.isArray(entityClassPermissions.toMerge[permissionClass])) {
                return true;
            }

            entityClassPermissions.toMerge[permissionClass].forEach(operation => {
                if (!ENTITY_CRUD_OPERATIONS.includes(operation)) {
                    return true;
                }

                // It's still possible that the key doesn't exist in output object, so we do additional checks.
                if (!output["entities"][entityClass]) {
                    output["entities"][entityClass] = {};
                }

                // If permission class doesn't exist, just set directly allowed operations, otherwise merge.
                if (output["entities"][entityClass][permissionClass]) {
                    if (!output["entities"][entityClass][permissionClass].includes(operation)) {
                        output["entities"][entityClass][permissionClass].push(operation);
                    }
                } else {
                    output["entities"][entityClass][permissionClass] = [operation];
                }
            });
        });
    });
};
