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
 * Per-request holder for the public origin the client actually reached, EXTRACTED by the transport
 * from its forwarding headers (e.g. `x-forwarded-proto` / `x-forwarded-host` / `x-forwarded-prefix`
 * of a Node HTTP request). Already absolute and without a trailing slash, e.g.
 * `https://wby6.localhost/api`.
 *
 * Needed because the api hands out absolute URLs — the file `srcPrefix` and the upload endpoint —
 * to clients that can't resolve a relative one. Its own socket only knows the address the proxy
 * dialled, which is not an address anything else can reach.
 *
 * Null whenever the transport has no such notion (S3 events, background tasks) or nothing is
 * forwarding. Callers fall back to the configured origin, so a deployment that sets one explicitly
 * is never second-guessed.
 */
export interface IRequestOrigin {
    get(): string | null;
    set(origin: string | null): void;
}

export const RequestOrigin = createAbstraction<IRequestOrigin>("RequestContext/RequestOrigin");

export namespace RequestOrigin {
    export type Interface = IRequestOrigin;
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
