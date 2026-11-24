import { createAbstraction } from "@webiny/feature/admin";

export interface AdminUsersCapabilitiesData {
    /**
     * A user's account is shared by all of their tenants, so a New User whose email has an account
     * in another tenant is linked to this tenant instead of created. Needs the `adminUsers.checkEmail`
     * query and the `adminUsers.linkUser` mutation.
     */
    linkAccounts: boolean;
    /** An administrator can reset another user's MFA. Needs the `adminUsers.resetUserMfa` mutation. */
    resetMfa: boolean;
}

/**
 * What the identity provider behind the Users screen supports beyond creating, editing and deleting
 * users. Set by the provider's admin extension through `<AdminUsers capabilities={...} />`.
 */
export const AdminUsersCapabilities =
    createAbstraction<AdminUsersCapabilitiesData>("AdminUsers/Capabilities");

export namespace AdminUsersCapabilities {
    export type Interface = AdminUsersCapabilitiesData;
}
