export const PERMISSION_CMS_SETTING = "cms.manage.setting";

export const actionTypes = {
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

export const reducer = (currentState, action) => {
    switch (action.type) {
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const incomingPermission = action.payload;

            return {
                ...currentState,
                synced: true,
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
    permission: { name: PERMISSION_CMS_SETTING, manageEnvironments: false, manageAliases: false },
    synced: false
};
