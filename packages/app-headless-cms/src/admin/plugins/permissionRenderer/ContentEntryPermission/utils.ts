import { AccessLevel } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";

export const PERMISSION_CMS_CONTENT_ENTRY = "cms.manage.contentEntry";

export const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_ENTRY,
        label: "Records inside any content model"
    },
    {
        id: 2,
        value: PERMISSION_CMS_CONTENT_ENTRY + "#models",
        label: "Only records inside specific content models"
    },
    {
        id: 3,
        value: PERMISSION_CMS_CONTENT_ENTRY + "#groups",
        label: "Only records in specific content groups"
    },
    {
        id: 4,
        value: PERMISSION_CMS_CONTENT_ENTRY + "#own",
        label: "Only records in content models they created"
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

            showModelSelector = permissionLevel.includes("#models");
            showGroupSelector = permissionLevel.includes("#groups");

            const own = permissionLevel.includes("own");
            const permissionName = permissionLevel.split("#")[0];

            // let models = currentState.permission.models;
            // if (currentState.showModelSelector && !showModelSelector) {
            //     models = [];
            // }
            //
            // let groups = currentState.permission.groups;
            // if (currentState.showModelSelector && !showModelSelector) {
            //     groups = [];
            // }

            return {
                ...currentState,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
                permission: {
                    ...currentState.permission,
                    name: permissionName,
                    own
                }
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const currentPermission = action.payload;

            permissionLevel = PERMISSION_CMS_CONTENT_ENTRY;

            if (currentPermission.own) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY + "#own";
            }

            if (Array.isArray(currentPermission.models) && currentPermission.models.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY + "#models";
                showModelSelector = true;
            }

            if (Array.isArray(currentPermission.groups) && currentPermission.groups.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY + "#groups";
                showGroupSelector = true;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
                permission: { ...currentPermission, name: PERMISSION_CMS_CONTENT_ENTRY }
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
    permission: {
        name: "",
        own: false,
        models: [],
        groups: [],
        locales: []
    },
    showModelSelector: false,
    showGroupSelector: false,
    synced: false
};
