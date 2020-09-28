import { plugins } from "@webiny/plugins";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import {
    accessLevelOperations,
    AccessLevelOperationType,
    orderAccessLevel
} from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { PermissionRendererFileManager } from "@webiny/app-file-manager/types";

const createPermissionsForDB = (permission: SecurityPermission): SecurityPermission[] => {
    const { name: permissionName, accessLevel, ...props } = permission;

    if (!permission.name) {
        return [];
    }

    if (!accessLevel) {
        return [permission];
    }

    // Create operation operationTypes from access level
    const operationTypes: AccessLevelOperationType[] = accessLevel.split("|");

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
            const operation = tokens.pop() as AccessLevelOperationType;
            let permissionNameAsKey = tokens.join(dot);

            // Special case where the permission name doesn't contains "operation"
            // For example, "cms.manage.setting" or "cms.manage.environment"
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
            const operationType = perm.name.split(".").pop() as AccessLevelOperationType;
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
    const cmsPermissionRendererPlugins = plugins.byType<PermissionRendererCmsManage>(
        "permission-renderer-cms-manage"
    );

    const fileManagerPermissionRendererPlugins = plugins.byType<PermissionRendererFileManager>(
        "permission-renderer-file-manager"
    );

    const keys = [
        ...cmsPermissionRendererPlugins.map(pl => pl.key),
        ...fileManagerPermissionRendererPlugins.map(pl => pl.key)
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
