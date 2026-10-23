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
    /** Nothing to switch to: the login fails. */
    | { type: "unresolved" };

export interface ILoginTenantResolver {
    /**
     * Decide where to log in when the user has no access to the current tenant, but has access
     * to these tenants.
     */
    resolveTenants(tenants: Tenant[]): Promise<LoginTenantResolution>;
    /**
     * Decide what to do when `security.login` fails on the current tenant.
     */
    resolveError(error: LogInError): Promise<LoginTenantResolution>;
}

/** Decide which tenant to log into when the user can't log into the current one. */
export const LoginTenantResolver = createAbstraction<ILoginTenantResolver>("LoginTenantResolver");

export namespace LoginTenantResolver {
    export type Interface = ILoginTenantResolver;
    export type Resolution = LoginTenantResolution;
}
