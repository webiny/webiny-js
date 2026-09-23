import { createAbstraction } from "@webiny/feature/api";

/**
 * Per-request holder for the raw tenant id EXTRACTED by the transport (e.g. the `x-tenant` header
 * of an API Gateway event, the bucket name of an S3 event, or `payload.tenant` of a background
 * task). The transport-specific EXTRACT step sets this; the transport-agnostic LOAD step
 * (RequestTenantLoader) reads it, resolves the Tenant, and sets TenantContext.
 */
export interface IRawTenantId {
    get(): string | null;
    set(id: string | null): void;
}

export const RawTenantId = createAbstraction<IRawTenantId>("RequestContext/RawTenantId");

export namespace RawTenantId {
    export type Interface = IRawTenantId;
}

/**
 * Per-request holder for the raw auth token EXTRACTED by the transport (e.g. the `Authorization`
 * bearer header or an auth cookie of an API Gateway event). Only token-based transports set this;
 * the transport-agnostic LOAD step (RequestIdentityLoader) reads it, authenticates it, and
 * sets IdentityContext. A null/absent value authenticates as anonymous.
 *
 * Note: non-token transports (S3, background tasks) never set this — S3 has no user identity, and
 * background-task identity is derived from `task.createdBy` after the task is fetched.
 */
export interface IRawAuthToken {
    get(): string | null;
    set(token: string | null): void;
}

export const RawAuthToken = createAbstraction<IRawAuthToken>("RequestContext/RawAuthToken");

export namespace RawAuthToken {
    export type Interface = IRawAuthToken;
}

/**
 * Per-request holder for the role or team the caller asked to be evaluated as, EXTRACTED by the
 * transport from the `x-webiny-assume-role` header. This is a preview mechanism: it can only ever
 * narrow what a caller may do, never widen it. AssumedRolePermissions reads this holder and
 * substitutes the permission set, but only after confirming the caller's own permissions grant
 * full access.
 *
 * Note: only the HTTP transports set this. S3 and background tasks have no caller to preview as.
 */
export interface IAssumedRoleRequest {
    type: "role" | "team";
    id: string;
}

export interface IRawAssumedRole {
    get(): IAssumedRoleRequest | null;
    set(value: IAssumedRoleRequest | null): void;
}

export const RawAssumedRole = createAbstraction<IRawAssumedRole>("RequestContext/RawAssumedRole");

export namespace RawAssumedRole {
    export type Interface = IRawAssumedRole;
    export type Request = IAssumedRoleRequest;
}

/**
 * LOAD step: authenticates the token held by RawAuthToken and sets IdentityContext. Fully
 * transport-agnostic — transports only EXTRACT the token into RawAuthToken.
 */
export interface IRequestIdentityLoader {
    establish(): Promise<void>;
}

export const RequestIdentityLoader = createAbstraction<IRequestIdentityLoader>(
    "RequestContext/RequestIdentityLoader"
);

export namespace RequestIdentityLoader {
    export type Interface = IRequestIdentityLoader;
}

/**
 * LOAD step: resolves the Tenant for the id held by RawTenantId and sets TenantContext. Fully
 * transport-agnostic — transports only EXTRACT the id into RawTenantId.
 */
export interface IRequestTenantLoader {
    establish(): Promise<void>;
}

export const RequestTenantLoader = createAbstraction<IRequestTenantLoader>(
    "RequestContext/RequestTenantLoader"
);

export namespace RequestTenantLoader {
    export type Interface = IRequestTenantLoader;
}
