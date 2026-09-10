export { until } from "@webiny/api/testing/until.js";
export { sleep } from "@webiny/api/testing/sleep.js";

export interface PermissionsArg {
    name: string;
}

export const identity = {
    id: "12345678",
    displayName: "John Doe",
    type: "admin"
};

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "mailer.settings"
        }
    ];
};
