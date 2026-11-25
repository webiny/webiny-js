import { createAbstraction } from "@webiny/feature/api";
import type { Abstraction, Container } from "@webiny/di";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import type { Tenant } from "~/types/tenancy.js";
import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";

/** The storage every tenant runs on until per-tenant storage exists: the deploy's own. */
export const DEFAULT_TENANT_STORAGE = "default";

/**
 * One tenant's scope in a request: a container nested in the request container, built for that
 * tenant. Its `TenantContext` holds the tenant, and every service resolved from it (repositories,
 * storage operations, caches) acts on that tenant.
 *
 * Inside a `TenantScopes` callback, resolve services from the scope. Plain values (an identity, ids)
 * may come from outside, services may not: a service of another scope throws
 * `StaleKernelExecutionError` when used in this one.
 */
export interface ITenantScope {
    readonly tenant: Tenant;
    /** The storage the scope runs on (`DEFAULT_TENANT_STORAGE`). */
    readonly storage: string;
    resolve<T>(abstraction: Abstraction<T>): T;
    resolveAll<T>(abstraction: Abstraction<T>): T[];
}

/** A tenant's scope, given to a `TenantScopes` callback: resolve that tenant's services from it. */
export const TenantScope = createAbstraction<ITenantScope>("Tenancy/TenantScope");

export namespace TenantScope {
    export type Interface = ITenantScope;
}

export interface ITenantScopesOptions {
    /**
     * The storage the scope runs on. Only `DEFAULT_TENANT_STORAGE` exists for now: any other throws
     * `UnknownTenantStorageError`.
     */
    storage?: string;
}

/**
 * Runs code in a tenant's scope. Scopes are built on first use and kept for the rest of the
 * request, one per tenant and storage, so entering one again is cheap.
 *
 * The callback runs with the caller's identity and authorization state: the same user, checked
 * against the target tenant's permissions, and with authorization off if the caller turned it off.
 *
 * Request-level and tenant-neutral: resolve it from any container of the request.
 */
export interface ITenantScopes {
    withTenant<R>(
        tenant: Tenant,
        cb: (scope: ITenantScope) => Promise<R>,
        opts?: ITenantScopesOptions
    ): Promise<R>;
    withRootTenant<R>(cb: (scope: ITenantScope) => Promise<R>): Promise<R>;
    /** Runs `cb` in each tenant's scope, one after another. */
    withEachTenant<R>(tenants: Tenant[], cb: (scope: ITenantScope) => Promise<R>): Promise<R[]>;
}

/**
 * Run work in another tenant's scope (or the root tenant's, or each of several tenants'), resolving
 * that tenant's services from the scope. The one sanctioned place to resolve services by hand.
 */
export const TenantScopes = createAbstraction<ITenantScopes>("Tenancy/TenantScopes");

export namespace TenantScopes {
    export type Interface = ITenantScopes;
    export type Options = ITenantScopesOptions;
}

/**
 * The identity context of a tenant scope, if the scope's stack has one (a test's minimal stack may
 * not). `TenantScopes` registers it in each scope it builds, to carry the caller's identity into
 * another tenant's scope.
 */
export interface ITenantScopeIdentity {
    readonly identityContext: IdentityContext.Interface | undefined;
}

export const TenantScopeIdentity = createAbstraction<ITenantScopeIdentity>(
    "Tenancy/TenantScopeIdentity"
);

export namespace TenantScopeIdentity {
    export type Interface = ITenantScopeIdentity;
}

/**
 * Registers what a tenant scope has (the API's features, the storages, the project's extensions)
 * into a new scope's container. The transport registers it in the request container, next to the
 * tenant-neutral part of the request it registers there (`registerApiRequestStack`).
 */
export interface ITenantScopeRegistration {
    register(container: Container): Promise<void>;
}

export const TenantScopeRegistration = createAbstraction<ITenantScopeRegistration>(
    "Tenancy/TenantScopeRegistration"
);

export namespace TenantScopeRegistration {
    export type Interface = ITenantScopeRegistration;
}

/**
 * Which tenant an event runs in:
 * - `{ tenantId }`: that tenant, or the root tenant for `null`. With `ifUnknown: "root"` an unknown
 *   tenant runs in the root tenant's scope too, instead of failing with `TenantNotFoundError`.
 * - `"tenant-neutral"`: in no tenant's scope, with only the request container's services (the SQL
 *   schema setup, which runs before any tenant exists).
 */
export type EventTenant =
    | { tenantId: string | null; ifUnknown?: "fail" | "root" }
    | "tenant-neutral";

/**
 * Names the tenant of the events it knows: the EXTRACT step of the tenant, one per transport or
 * event type (the `x-tenant` header of an HTTP request, `tenant` of a background task's payload).
 * Registered in the root. Returns `undefined` for an event it doesn't know.
 *
 * An event no source knows runs in the root tenant's scope.
 */
export interface IInputTenantSource {
    getTenant(request: InputChainRunner.Request): EventTenant | undefined;
}

export const InputTenantSource = createAbstraction<IInputTenantSource>("Tenancy/InputTenantSource");

export namespace InputTenantSource {
    export type Interface = IInputTenantSource;
    export type Tenant = EventTenant;
}
