import { AccessLevel } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";

export const PERMISSION_CMS_CONTENT_MODEL = "cms.manage.contentModel";

export const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_MODEL,
        label: "All content models"
    },
    {
        id: 2,
        value: PERMISSION_CMS_CONTENT_MODEL + "#own",
        label: "Only the one they created"
    },
    {
        id: 3,
        value: PERMISSION_CMS_CONTENT_MODEL + "#models",
        label: "Only specific content models"
    },
    {
        id: 4,
        value: PERMISSION_CMS_CONTENT_MODEL + "#groups",
        label: "Only content models in a group"
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
    let showModelSelector = currentState.showModelSelector;
    let showGroupSelector = currentState.showGroupSelector;

    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            showModelSelector = permissionLevel.includes("models");
            showGroupSelector = permissionLevel.includes("groups");

            const permissionName = permissionLevel.split("#")[0];
            const own = permissionLevel.includes("own");

            const newPermission = {
                ...currentState.permission,
                name: permissionName,
                own,
                accessLevel:
                    currentState.permission.accessLevel || initialState.permission.accessLevel
            };

            if (own) {
                delete newPermission.accessLevel;
            }

            return {
                ...currentState,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
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

            permissionLevel = PERMISSION_CMS_CONTENT_MODEL;

            if (incomingPermission.own) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL + "#own";
            }

            if (Array.isArray(incomingPermission.models) && incomingPermission.models.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL + "#models";
                showModelSelector = true;
            }

            if (Array.isArray(incomingPermission.groups) && incomingPermission.groups.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL + "#groups";
                showGroupSelector = true;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
                permission: { ...incomingPermission, name: PERMISSION_CMS_CONTENT_MODEL }
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
    permission: { name: "", own: false, models: [], groups: [], accessLevel: AccessLevel.ReadOnly },
    showModelSelector: false,
    showGroupSelector: false,
    synced: false
};
