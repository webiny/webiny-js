import { AccessLevel } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";

export const PERMISSION_CMS_CONTENT_MODEL_GROUP = "cms.manage.contentModelGroup";

export const contentGroupPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_MODEL_GROUP,
        label: "All content groups"
    },
    {
        id: 2,
        value: PERMISSION_CMS_CONTENT_MODEL_GROUP + "#own",
        label: "Only the ones they created"
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

            const own = permissionLevel.includes("own");
            const permissionName = permissionLevel.split("#")[0];

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
                permission: newPermission
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const currentPermission = action.payload;

            permissionLevel = PERMISSION_CMS_CONTENT_MODEL_GROUP;

            if (currentPermission.own) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL_GROUP + "#own";
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                permission: { ...currentPermission, name: PERMISSION_CMS_CONTENT_MODEL_GROUP }
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
    permission: { name: "", own: false, accessLevel: AccessLevel.ReadOnly },
    synced: false
};
