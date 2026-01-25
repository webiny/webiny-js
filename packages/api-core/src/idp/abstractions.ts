import type { JwtPayload as IJwtPayload, JwtHeader as IJwtHeader } from "jsonwebtoken";
import { createAbstraction } from "@webiny/feature/api";
import type { IdentityData as IIdentityData } from "~/features/security/IdentityContext/Identity.js";
import type { Jwk as IJwk } from "~/features/security/utils/verifyJwtUsingJwk.js";

export type IJwt = {
    header: IJwtHeader;
    payload: IJwtPayload;
};

export type OptionalExternal<T> = Omit<T, "external"> & { external?: boolean};

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

export const OidcIdentityProvider =
    createAbstraction<IOidcIdentityProvider>("OidcIdentityProvider");

export namespace OidcIdentityProvider {
    export type Interface = IOidcIdentityProvider;
    export type JwtPayload = IJwtPayload;
    export type IdentityData = IProviderIdentityData;
}

interface IJwkCache {
    getKeys(issuer: string): Promise<IJwk[]>;
}

export const JwkCache = createAbstraction<IJwkCache>("JwkCache");
export namespace JwkCache {
    export type Interface = IJwkCache;
    export type Jwk = IJwk;
}
