import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";

export type SimplePermissionStateType = {
    permission: { name: string };
    synced: Boolean;
};

export enum ActionTypes {
    UPDATE_PERMISSION = "UPDATE_PERMISSION",
    SET_PERMISSION_LEVEL = "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS = "SYNC_PERMISSIONS",
    RESET = "RESET"
}

export type ReducerActionType = {
    type: ActionTypes;
    payload: any;
};

export const createSimplePermissionReducer = ({ initialState, permissionName }) => {
    return (currentState: SimplePermissionStateType, action: ReducerActionType) => {
        switch (action.type) {
            case ActionTypes.SET_PERMISSION_LEVEL:
                const on = action.payload;

                return {
                    ...currentState,
                    permission: {
                        ...currentState.permission,
                        name: on ? permissionName : ""
                    }
                };

            case ActionTypes.UPDATE_PERMISSION:
                const { key, value } = action.payload;
                return {
                    ...currentState,
                    permission: { ...currentState.permission, [key]: value }
                };
            case ActionTypes.SYNC_PERMISSIONS:
                const incomingPermission = action.payload;

                return {
                    ...currentState,
                    synced: true,
                    permission: { ...incomingPermission }
                };
            case ActionTypes.RESET:
                return {
                    ...initialState
                };
            default:
                throw new Error("Unrecognised action: " + action.type);
        }
    };
};

export const createSimplePermissionInitialState = (): SimplePermissionStateType => ({
    permission: { name: "" },
    synced: false
});

export type CustomPermissionStateType = {
    permission: SecurityPermission;
    synced: Boolean;
    showCustomPermissionUI: boolean;
    permissionLevel: string;
    permissions: { [key: string]: SecurityPermission };
};

export const createCustomPermissionInitialState = (): CustomPermissionStateType => ({
    permission: { name: "" },
    synced: false,
    showCustomPermissionUI: false,
    permissionLevel: "#",
    permissions: {}
});

const SEPARATOR = "#";
const CUSTOM = "custom";

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

export const createCustomPermissionReducer = ({ initialState, appName, permissionName }) => {
    return (currentState: CustomPermissionStateType, action: ReducerActionType) => {
        switch (action.type) {
            case ActionTypes.SET_PERMISSION_LEVEL:
                const selectedPermissionLevel = action.payload;
                const hasCustom = selectedPermissionLevel.includes(CUSTOM);
                const permissionNameFromPermissionLevel = selectedPermissionLevel.split(
                    SEPARATOR
                )[0];

                return {
                    ...currentState,
                    permissionLevel: selectedPermissionLevel,
                    showCustomPermissionUI: hasCustom,
                    permission: {
                        ...currentState.permission,
                        name: permissionNameFromPermissionLevel
                    },
                    permissions: hasCustom ? currentState.permissions : {}
                };

            case ActionTypes.UPDATE_PERMISSION:
                const { key, value } = action.payload;
                return {
                    ...currentState,
                    permissions: { ...currentState.permissions, [key]: value }
                };
            case ActionTypes.SYNC_PERMISSIONS:
                const allPermissions = createPermissionsArray(action.payload);
                const hasFullAccess = allPermissions.some(perm => perm.name === "*");
                const currentAppPermissions = allPermissions.filter(perm =>
                    perm.name.startsWith(appName)
                );

                if (currentAppPermissions.length === 0 && !hasFullAccess) {
                    return currentState;
                }

                if (hasFullAccess) {
                    return {
                        ...currentState,
                        permissionLevel: permissionName
                    };
                }

                let permissionLevel = currentState.permissionLevel;
                let permissions = currentState.permissions;
                let showCustomPermissionUI = currentState.showCustomPermissionUI;

                if (
                    currentAppPermissions.length === 1 &&
                    currentAppPermissions[0].name === permissionName
                ) {
                    permissionLevel = permissionName;
                } else {
                    showCustomPermissionUI = true;
                    permissionLevel = permissionName + "#custom";
                    // Prepare map for permissions
                    const obj = {};
                    currentAppPermissions.forEach(perm => {
                        obj[perm.name] = perm;
                    });
                    permissions = obj;
                }

                return {
                    ...currentState,
                    synced: true,
                    permissionLevel,
                    permissions,
                    showCustomPermissionUI,
                    permission: { ...currentState.permission, name: permissionName }
                };
            case ActionTypes.RESET:
                return {
                    ...initialState
                };
            default:
                throw new Error("Unrecognised action: " + action.type);
        }
    };
};
