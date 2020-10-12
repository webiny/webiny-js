export const PERMISSION_CMS_ENVIRONMENT = "cms.manage.environment";

export const environmentPermissionOption = [
    {
        id: 0,
        value: PERMISSION_CMS_ENVIRONMENT,
        label: "All environments"
    },
    {
        id: 1,
        value: PERMISSION_CMS_ENVIRONMENT + "#custom",
        label: "Only specific environments"
    }
];

export const actionTypes = {
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

export const reducer = (currentState, action) => {
    let permissionLevel = currentState.permissionLevel;
    let showCustomPermission = currentState.showCustomPermission;
    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            showCustomPermission = permissionLevel.includes("custom");

            return {
                ...currentState,
                permissionLevel,
                showCustomPermission
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const incomingPermission = action.payload;

            if (incomingPermission.environments && incomingPermission.environments.length) {
                permissionLevel = PERMISSION_CMS_ENVIRONMENT + "#custom";
                showCustomPermission = true;
            } else {
                permissionLevel = PERMISSION_CMS_ENVIRONMENT;
                showCustomPermission = false;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showCustomPermission,
                permission: { ...currentState.permission, ...incomingPermission }
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
    permissionLevel: PERMISSION_CMS_ENVIRONMENT,
    permission: { name: PERMISSION_CMS_ENVIRONMENT, environments: [] },
    showCustomPermission: false,
    synced: false
};
