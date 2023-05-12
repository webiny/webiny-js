export { until } from "@webiny/project-utils/testing/helpers/until";
export { sleep } from "@webiny/project-utils/testing/helpers/sleep";

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
