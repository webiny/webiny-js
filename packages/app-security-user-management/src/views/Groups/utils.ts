import { plugins } from "@webiny/plugins";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import { pick } from "lodash";

// FIXME: Remove this after "permission UI" refactor
export const accessLevelOperations = ["list", "update", "delete", "publish"];

export const orderAccessLevel = list => {
    return list.sort(accessLevelSorter);
};

const accessLevelSorter = (a, b) => {
    if (accessLevelOperations.indexOf(a) > accessLevelOperations.indexOf(b)) {
        return 1;
    } else if (accessLevelOperations.indexOf(a) < accessLevelOperations.indexOf(b)) {
        return -1;
    } else {
        return 0;
    }
};

const createPermissionsForDB = (permission: SecurityPermission): SecurityPermission[] => {
    const { name: permissionName, accessLevel, ...props } = permission;

    if (!permission.name) {
        return [];
    }

    if (!accessLevel) {
        return [permission];
    }

    // Create operation operationTypes from access level
    const operationTypes = accessLevel.split("|");

    return operationTypes.map(token => ({
        ...props,
        name: `${permissionName}.${token}`
    }));
};

const createPermissionForUI = (
    permissions: SecurityPermission[],
    keys: string[]
): SecurityPermission[] => {
    const formattedPermissions = [];

    // Handle full-access permissions
    const fullAccessPermissions = permissions.filter(perm => perm.name.includes("*"));
    formattedPermissions.push(...fullAccessPermissions);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        const permissionsWithKey = permissions.filter(perm => {
            const dot = ".";
            const tokens = perm.name.split(dot);
            const operation = tokens.pop();
            let permissionNameAsKey = tokens.join(dot);

            // Special case where the permission name doesn't contains "operation"
            // For example, "cms.manage.setting" or "cms.manage.environment"
            // @ts-ignore
            if (!accessLevelOperations.includes(operation)) {
                permissionNameAsKey = perm.name;
            }

            return permissionNameAsKey === key;
        });
        // If there are no permission for current key, continue with next key
        if (!permissionsWithKey.length) {
            continue;
        }

        const mergedPermission = {
            name: key
        };

        let permissionProps = {};
        const operations = [];

        permissionsWithKey.forEach(perm => {
            const operationType = perm.name.split(".").pop();
            // @ts-ignore
            if (accessLevelOperations.includes(operationType)) {
                operations.push(operationType);
            }

            permissionProps = { ...permissionProps, ...perm };
        });

        if (operations.length) {
            mergedPermission["accessLevel"] = orderAccessLevel(operations).join("|");
        }

        formattedPermissions.push({ ...permissionProps, ...mergedPermission });
    }

    return formattedPermissions.length ? formattedPermissions : permissions;
};

export const createPermissionsMap = (permissions: SecurityPermission[]) => {
    // FIXME: Remove this after "permission UI" refactor
    const cmsPermissionRendererPlugins = plugins.byType("permission-renderer-cms-manage");
    const fileManagerPermissionRendererPlugins = plugins.byType("permission-renderer-file-manager");
    const securityPermissionRendererPlugins = plugins.byType("permission-renderer-security");

    const keys = [
        ...cmsPermissionRendererPlugins.map(pl => pl.key),
        ...fileManagerPermissionRendererPlugins.map(pl => pl.key),
        ...securityPermissionRendererPlugins.map(pl => pl.key)
    ];

    const permissionsMap = {};
    if (!permissions || !Array.isArray(permissions)) {
        return permissionsMap;
    }

    const permissionList = createPermissionForUI(permissions, keys);

    for (let i = 0; i < permissionList.length; i++) {
        const perm = permissionList[i];
        if (perm.name) {
            permissionsMap[perm.name] = perm;
        }
    }
    return permissionsMap;
};

export const createPermissionsArray = (permissionsMap: object) => {
    const permissions: SecurityPermission[] = [];

    if (!permissionsMap) {
        return permissions;
    }

    const values = Object.values(permissionsMap);

    for (let i = 0; i < values.length; i++) {
        const permission: SecurityPermission = values[i];

        const formattedPermissions = createPermissionsForDB(permission);

        formattedPermissions.forEach(perm => {
            const alreadyExist = permissions.findIndex(item => item.name === perm.name) !== -1;
            if (perm.name && !alreadyExist) {
                permissions.push(perm);
            }
        });
    }

    return permissions;
};

export const formatDataForAPI = data => ({
    data: {
        ...pick(data, ["name", "slug", "description"]),
        // From UI to API
        permissions: createPermissionsArray(data.permissions) || []
    }
});
