import {
    createCustomPermissionInitialState,
    createCustomPermissionReducer
} from "@webiny/app-security-user-management/components/permission/utils";

export const fullAccessPermissionName = "security.*";

export const permissionLevelOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: fullAccessPermissionName,
        label: "Full Access"
    },
    {
        id: 2,
        value: fullAccessPermissionName + "#custom",
        label: "Custom Access"
    }
];

const appName = "security";

export const initialState = createCustomPermissionInitialState();

export const reducer = createCustomPermissionReducer({
    initialState,
    appName,
    permissionName: fullAccessPermissionName
});
