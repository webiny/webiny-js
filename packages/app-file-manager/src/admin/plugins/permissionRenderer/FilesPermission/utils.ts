import { AccessLevel } from "@webiny/app-security-user-management/components/permission";

export const PERMISSION_FILES_FILE = "files.file";

export const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_FILES_FILE,
        label: "All files"
    },
    {
        id: 2,
        value: PERMISSION_FILES_FILE + "#own",
        label: "Only the one they created"
    }
];

export const actionTypes = {
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

export const reducer = (currentState, action) => {
    let permissionLevel = currentState.permissionLevel;

    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            const permissionName = permissionLevel.split("#")[0];
            const own = permissionLevel.includes("own");

            const newPermission = {
                ...currentState.permission,
                name: permissionName,
                own
            };

            if (own) {
                newPermission.accessLevel = AccessLevel.ReadWriteDelete;
            }

            return {
                ...currentState,
                permissionLevel,
                permission: {
                    ...newPermission
                }
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const incomingPermission = action.payload;

            permissionLevel = PERMISSION_FILES_FILE;

            if (incomingPermission.own) {
                permissionLevel = PERMISSION_FILES_FILE + "#own";
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                permission: { ...incomingPermission, name: PERMISSION_FILES_FILE }
            };
        case actionTypes.RESET:
            return {
                ...initialState
            };
        default:
            throw new Error("Unrecognised action: " + action.type);
    }
};

export const initialState = {
    permissionLevel: "#",
    permission: { name: "", own: false, accessLevel: AccessLevel.ReadOnly },
    synced: false
};
