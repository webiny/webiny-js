import { createAbstraction } from "@webiny/feature/admin";

export interface IAdminUsersSettings {
    /**
     * Whether an existing user's email can be changed in the Users and Account forms. The identity
     * provider decides: a legacy Cognito pool that uses the email as the username cannot follow.
     */
    emailChangeable: boolean;
}

/** What the identity provider that renders `<AdminUsers>` allows in the user forms. */
export const AdminUsersSettings = createAbstraction<IAdminUsersSettings>("AdminUsers/Settings");

export namespace AdminUsersSettings {
    export type Interface = IAdminUsersSettings;
}
