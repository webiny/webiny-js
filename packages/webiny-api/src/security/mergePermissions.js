// @flow
import entitiesMerger from "./mergePermissions/entitiesMerger";
import apiMerger from "./mergePermissions/apiMerger";

const mergers = {
    entities: entitiesMerger,
    api: apiMerger
};

/**
 * Merges an array of permissions.
 * Permissions can hold API and entities permissions.
 * @param permissions
 */
export default (permissions: Array<Object> = []): Object => {
    if (!Array.isArray(permissions)) {
        return {};
    }

    const output = {};
    permissions.forEach(current => {
        Object.keys(current).forEach(key => {
            if (mergers[key]) {
                mergers[key](output, current[key]);
                return true;
            }
        });
    });

    return output;
};
