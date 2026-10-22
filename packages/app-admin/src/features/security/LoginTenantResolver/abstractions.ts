import { createAbstraction } from "@webiny/feature/admin";
import type { Tenant } from "~/features/tenancy/abstractions.js";
import type { LogInError } from "~/features/security/LogIn/index.js";

export type LoginTenantResolution =
    /** Log in again on this tenant. */
    | { type: "switchTenant"; tenantId: string }
    /** The user has to pick one of these tenants. */
    | { type: "selectTenant"; tenants: Tenant[] }
    /** The user can't access any tenant. */
    | { type: "noTenantAccess" }
    /** The error isn't about the tenant. */
    | { type: "unresolved" };

export interface ILoginTenantResolver {
    /**
     * Decide what to do when `security.login` fails on the current tenant.
     */
    resolve(error: LogInError): Promise<LoginTenantResolution>;
}

/** Decide which tenant to log into when the login fails on the current one. */
export const LoginTenantResolver = createAbstraction<ILoginTenantResolver>("LoginTenantResolver");

export namespace LoginTenantResolver {
    export type Interface = ILoginTenantResolver;
    export type Resolution = LoginTenantResolution;
}
