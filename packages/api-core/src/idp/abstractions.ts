import type { JwtPayload as IJwtPayload, JwtHeader as IJwtHeader } from "jsonwebtoken";
import { createAbstraction } from "@webiny/feature/api";
import type { IdentityData as IIdentityData } from "~/features/security/IdentityContext/Identity.js";
import type { Jwk as IJwk } from "~/features/security/utils/verifyJwtUsingJwk.js";

export type IJwt = {
    header: IJwtHeader;
    payload: IJwtPayload;
};

export type OptionalExternal<T> = Omit<T, "external"> & { external?: boolean };

export type IProviderIdentityData = Omit<IIdentityData, "type" | "profile"> & {
    /**
     * Defaults to `admin` it omitted.
     */
    type?: string;
    profile?: OptionalExternal<NonNullable<IIdentityData["profile"]>>;
};

// Generic Idp Provider
export interface IIdentityProvider {
    isApplicable(token: string): boolean;
    getIdentity(token: string): Promise<IProviderIdentityData | null>;
}

/** Generic identity provider for token-based authentication. */
export const IdentityProvider = createAbstraction<IIdentityProvider>("IdentityProvider");

export namespace IdentityProvider {
    export type Interface = IIdentityProvider;
    export type IdentityData = IProviderIdentityData;
    export type JwtPayload = IJwtPayload;
}

export interface IJwtIdentityProvider {
    isApplicable(token: IJwtPayload): boolean;
    getIdentity(token: string, jwt: IJwt): Promise<IProviderIdentityData | null>;
}

/** JWT-specific identity provider for token validation. */
export const JwtIdentityProvider = createAbstraction<IJwtIdentityProvider>("JwtIdentityProvider");

export namespace JwtIdentityProvider {
    export type Interface = IJwtIdentityProvider;
    export type Jwt = IJwt;
    export type JwtPayload = IJwtPayload;
    export type JwtHeader = IJwtHeader;
    export type IdentityData = IProviderIdentityData;
}

// OIDC Provider
export interface IOidcIdentityProvider {
    issuer: string;
    clientId: string;
    isApplicable(token: IJwtPayload): boolean;
    getIdentity(jwt: IJwtPayload): Promise<IProviderIdentityData>;
    verifyToken?(token: string): Promise<IJwtPayload | undefined>;
    verifyTokenClaims?(token: IJwtPayload): Promise<void>;
}

/** OIDC-compliant identity provider with issuer validation. */
export const OidcIdentityProvider =
    createAbstraction<IOidcIdentityProvider>("OidcIdentityProvider");

export namespace OidcIdentityProvider {
    export type Interface = IOidcIdentityProvider;
    export type JwtPayload = IJwtPayload;
    export type IdentityData = IProviderIdentityData;
}

interface IJwkCache {
    getKeys(issuer: string): Promise<IJwk[]>;
    /**
     * Fetches the issuer's keys again, for a token signed with a key the cached set doesn't have
     * (the issuer rotated its keys). Returns null when a fetch started less than a minute ago, or
     * when the fetch fails, so tokens with made-up key ids can't make every request call the issuer.
     */
    refreshKeys(issuer: string): Promise<IJwk[] | null>;
}

/** Cache for JSON Web Keys used in JWT verification. */
export const JwkCache = createAbstraction<IJwkCache>("JwkCache");
export namespace JwkCache {
    export type Interface = IJwkCache;
    export type Jwk = IJwk;
}

export interface IJwksIssuerState {
    keys?: IJwk[];
    // When the keys were last fetched successfully.
    fetchedAt?: number;
    // When a fetch last started, successful or not. Limits how often an unknown key id can refetch.
    lastAttemptAt?: number;
    // The fetch in progress, shared by every request that needs it.
    pending?: Promise<IJwk[]>;
}

export interface IJwksStore {
    // Returns the issuer's state, creating it on first use. Callers update it in place.
    get(issuer: string): IJwksIssuerState;
}

/**
 * Keeps each issuer's JSON Web Keys across requests. Register it in the ROOT container: JwkCache is
 * registered per request, so keys kept there would be fetched again on every request.
 */
export const JwksStore = createAbstraction<IJwksStore>("JwksStore");
export namespace JwksStore {
    export type Interface = IJwksStore;
    export type IssuerState = IJwksIssuerState;
}
