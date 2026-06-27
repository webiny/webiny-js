import { createAbstraction } from "@webiny/feature/api";

/**
 * Extracts the raw tenant identifier from a transport event (e.g. the `x-tenant` header of an API
 * Gateway event, or a field of an S3 event). This is the ONLY transport-aware part of establishing
 * the request tenant — the resolution (id -> Tenant) and setting of TenantContext is transport-
 * agnostic and lives in RequestTenantEstablisher.
 *
 * Multiple extractors may be registered; they are tried in registration order and the first one
 * to return a value wins. An extractor returns null/undefined when the event isn't its shape.
 */
export interface ITenantIdExtractor {
    extract(event: unknown): string | null | undefined;
}

export const TenantIdExtractor = createAbstraction<ITenantIdExtractor>(
    "RequestContext/TenantIdExtractor"
);

export namespace TenantIdExtractor {
    export type Interface = ITenantIdExtractor;
}

/**
 * Extracts a raw auth token from a transport event (e.g. the `Authorization` header or an auth
 * cookie). Transport-aware; the token -> Identity authentication is transport-agnostic and lives
 * in RequestIdentityEstablisher.
 *
 * Multiple extractors may be registered; they are tried in registration order. An extractor
 * returns null/undefined when it does not apply to the event (and is skipped); an empty string is
 * treated as "applicable but no token" (authenticated as anonymous), matching the previous
 * always-authenticate-the-header behavior.
 */
export interface IAuthTokenExtractor {
    extract(event: unknown): string | null | undefined;
}

export const AuthTokenExtractor = createAbstraction<IAuthTokenExtractor>(
    "RequestContext/AuthTokenExtractor"
);

export namespace AuthTokenExtractor {
    export type Interface = IAuthTokenExtractor;
}

/**
 * Establishes the request identity from a raw transport event, using the registered
 * AuthTokenExtractor implementations to find an auth token, then authenticating it and setting
 * IdentityContext. Transport-agnostic — transports only contribute extractors.
 */
export interface IRequestIdentityEstablisher {
    establish(event: unknown): Promise<void>;
}

export const RequestIdentityEstablisher = createAbstraction<IRequestIdentityEstablisher>(
    "RequestContext/RequestIdentityEstablisher"
);

export namespace RequestIdentityEstablisher {
    export type Interface = IRequestIdentityEstablisher;
}

/**
 * Establishes the request tenant from a raw transport event, using the registered TenantIdExtractor
 * implementations to find a tenant id, then resolving the Tenant and setting TenantContext.
 * Transport-agnostic — transports only contribute extractors.
 */
export interface IRequestTenantEstablisher {
    establish(event: unknown): Promise<void>;
}

export const RequestTenantEstablisher = createAbstraction<IRequestTenantEstablisher>(
    "RequestContext/RequestTenantEstablisher"
);

export namespace RequestTenantEstablisher {
    export type Interface = IRequestTenantEstablisher;
}
