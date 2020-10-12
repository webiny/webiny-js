import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";

export const PERMISSION_CMS_MANAGE_ALL = "cms.manage.*";

export const permissionLevelOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_MANAGE_ALL,
        label: "Full Access"
    },
    {
        id: 2,
        value: PERMISSION_CMS_MANAGE_ALL + "#custom",
        label: "Custom Access"
    }
];

export const actionTypes = {
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

const createPermissionsArray = (permissionsMap: object) => {
    const permissions: SecurityPermission[] = [];

    if (!permissionsMap) {
        return permissions;
    }

    const values = Object.values(permissionsMap);

    for (let i = 0; i < values.length; i++) {
        const perm: SecurityPermission = values[i];
        if (perm.name) {
            permissions.push(perm);
        }
    }
    return permissions;
};

export const reducer = (currentState, action) => {
    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            const isCustom = action.payload.includes("custom");
            const permissionName = action.payload.split("#")[0];

            return {
                ...currentState,
                permissionLevel: action.payload,
                showCustomPermission: isCustom,
                permission: {
                    ...currentState.permission,
                    name: permissionName
                },
                permissions: isCustom ? currentState.permissions : {}
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permissions: { ...currentState.permissions, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const perms = createPermissionsArray(action.payload);
            const hasFullAccess = perms.some(perm => perm.name === "*");
            const cmsPermissions = perms.filter(perm => perm.name.startsWith("cms"));

            if (cmsPermissions.length === 0 && !hasFullAccess) {
                return currentState;
            }

            if (hasFullAccess) {
                return {
                    ...currentState,
                    permissionLevel: PERMISSION_CMS_MANAGE_ALL
                };
            }

            let permissionLevel = currentState.permissionLevel;
            let permissions = currentState.permissions;
            let showCustomPermission = currentState.showCustomPermission;

            if (
                cmsPermissions.length === 1 &&
                cmsPermissions[0].name === PERMISSION_CMS_MANAGE_ALL
            ) {
                permissionLevel = PERMISSION_CMS_MANAGE_ALL;
            } else {
                showCustomPermission = true;
                permissionLevel = PERMISSION_CMS_MANAGE_ALL + "#custom";
                const obj = {};
                cmsPermissions.forEach(perm => {
                    obj[perm.name] = perm;
                });
                permissions = obj;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                permissions,
                showCustomPermission,
                permission: { ...currentState.permission, name: PERMISSION_CMS_MANAGE_ALL }
            };
        case actionTypes.RESET:
            return {
                ...initialState
            };
        default:
            throw new Error("Unrecognised action: " + action);
    }
};

export const initialState = {
    permissionLevel: "#",
    permission: { name: "" },
    permissions: {},
    showCustomPermission: false,
    synced: false
};
