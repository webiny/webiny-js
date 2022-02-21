/**
 * Not used anymore so ignore.
 */
// @ts-nocheck
import mergeWith from "lodash/mergeWith";
import isEmpty from "lodash/isEmpty";
import { CmsModel } from "./types";

type Group = {
    [code: string]: string[];
};
type Model = {
    [code: string]: string[];
};
interface CMSPermission {
    name: string;
    rwd?: string;
    pw?: string;
    own?: boolean;
    groups?: Group;
    models?: Model;
}

enum AccessTypes {
    FULL = "cms.*",
    CONTENT_MODEL_GROUP = "cms.contentModelGroup",
    CONTENT_MODEL = "cms.contentModel",
    CONTENT_ENTRY = "cms.contentEntry"
}

export const migrateCMSPermissions = async (
    permissions: CMSPermission[],
    getModel: (modelId: string) => Promise<CmsModel>
): Promise<CMSPermission[]> => {
    // First we've to know whether is a "full" access or "custom" access.
    const fullAccess = permissions.find(permission => permission.name === AccessTypes.FULL);

    if (fullAccess) {
        return permissions;
    }

    // We'll construct the new newPermissions one by one.
    const newPermissions = {};

    const DEFAULT_PERMISSIONS = {
        [AccessTypes.CONTENT_MODEL_GROUP]: {
            name: AccessTypes.CONTENT_MODEL_GROUP,
            rwd: "r",
            own: false
        },
        [AccessTypes.CONTENT_MODEL]: {
            name: AccessTypes.CONTENT_MODEL,
            rwd: "r",
            own: false
        },
        [AccessTypes.CONTENT_ENTRY]: {
            name: AccessTypes.CONTENT_ENTRY,
            rwd: "r",
            own: false
        }
    };

    // Create new permissions.
    [AccessTypes.CONTENT_MODEL_GROUP, AccessTypes.CONTENT_MODEL, AccessTypes.CONTENT_ENTRY].forEach(
        entity => {
            // Check for "entity" permission existence.
            const existingPermission = permissions.find(permission => permission.name === entity);
            if (existingPermission) {
                newPermissions[entity] = existingPermission;
            } else {
                newPermissions[entity] = DEFAULT_PERMISSIONS[entity];
            }

            // Handle specific cases.
            if (entity === AccessTypes.CONTENT_MODEL_GROUP) {
                // Just to be on the safer side.
                if (newPermissions[entity].own) {
                    setAccessScopeToOwn(newPermissions, entity);
                }
            }
            // Handle specific cases.
            if (entity === AccessTypes.CONTENT_MODEL) {
                // Just to be on the safer side.
                if (newPermissions[entity].own) {
                    setAccessScopeToOwn(newPermissions, entity);
                }
                // If parent has the "own" access scope.
                if (newPermissions[AccessTypes.CONTENT_MODEL_GROUP].own) {
                    setAccessScopeToOwn(newPermissions, entity);
                }
                // Transfer groups data to content model groups permission
                if (newPermissions[entity].groups) {
                    moveGroups(newPermissions, entity);
                }
            }
            // Handle specific cases.
            if (entity === AccessTypes.CONTENT_ENTRY) {
                // Just to be on the safer side.
                if (newPermissions[entity].own) {
                    setAccessScopeToOwn(newPermissions, entity);
                }
                // If parent has the "own" access scope.
                if (newPermissions[AccessTypes.CONTENT_MODEL].own) {
                    setAccessScopeToOwn(newPermissions, entity);
                }
                // Transfer groups data to content model groups permission
                if (newPermissions[entity].groups) {
                    moveGroups(newPermissions, entity);
                }
                // Transfer models data to content model groups permission
                if (newPermissions[entity].models) {
                    moveModels(newPermissions, entity);
                }
            }
        }
    );

    /*
     * Sync "models" and "groups".
     * If there is a model from "cms.contentModel" permission's models property;
     * whose content group is missing from "cms.contentModelGroup" permission's groups property;
     * we add that into "cms.contentModelGroup" permission.
     *
     * Why?
     * Because, now the user must need to have at least READ permission on "cms.contentModelGroup" to access a model defined by "cms.contentModel".
     * */
    const contentModels = newPermissions[AccessTypes.CONTENT_MODEL].models;

    if (!isEmpty(contentModels)) {
        const contentModelGroups = newPermissions[AccessTypes.CONTENT_MODEL_GROUP].groups || {};

        const locales = Object.keys(contentModels);
        for (let i = 0; i < locales.length; i++) {
            const code = locales[i];
            for (let j = 0; j < contentModels[code].length; j++) {
                const modelId = contentModels[code][j];
                // Check if we've access to it's contentModelGroup.
                const { group } = await getModel(modelId);

                if (isEmpty(contentModelGroups[code])) {
                    contentModelGroups[code] = [];
                }
                if (!contentModelGroups[code].includes(group.id)) {
                    contentModelGroups[code].push(group.id);
                }
            }
        }

        // Update "groups" value in permission.
        newPermissions[AccessTypes.CONTENT_MODEL_GROUP].groups = contentModelGroups;
    }

    return Object.values(newPermissions);
};

const mergeCustomizer = (objValue, srcValue) => {
    if (Array.isArray(objValue) === false) {
        return [];
    }
    return objValue.concat(srcValue).filter(removeDuplicate);
};

const removeDuplicate = (item, index, arr) => arr.findIndex(el => el === item) === index;

const moveGroups = (permissions, entity) => {
    if (!isEmpty(permissions[AccessTypes.CONTENT_MODEL_GROUP]["groups"])) {
        permissions[AccessTypes.CONTENT_MODEL_GROUP]["groups"] = mergeWith(
            permissions[AccessTypes.CONTENT_MODEL_GROUP]["groups"],
            permissions[entity].groups,
            mergeCustomizer
        );
    } else {
        permissions[AccessTypes.CONTENT_MODEL_GROUP]["groups"] = permissions[entity].groups;
    }
    // Remove "groups" from content model permission
    delete permissions[entity].groups;
};

const moveModels = (permissions, entity) => {
    if (!isEmpty(permissions[AccessTypes.CONTENT_MODEL]["models"])) {
        permissions[AccessTypes.CONTENT_MODEL]["models"] = mergeWith(
            permissions[AccessTypes.CONTENT_MODEL]["models"],
            permissions[entity].models,
            mergeCustomizer
        );
    } else {
        permissions[AccessTypes.CONTENT_MODEL]["models"] = permissions[entity].models;
    }
    // Remove "models" from content model permission
    delete permissions[entity].models;
};

const setAccessScopeToOwn = (permissions, entity) => {
    permissions[entity].own = true;
    // Set primary action.
    permissions[entity].rwd = "rwd";

    // Remove "groups" from content model permission
    delete permissions[entity].groups;

    // Remove "models" from content model permission
    delete permissions[entity].models;
};
