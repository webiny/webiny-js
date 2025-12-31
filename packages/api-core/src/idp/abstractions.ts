import type { JwtPayload } from "jsonwebtoken";
import { createAbstraction } from "@webiny/feature/api";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

export interface IIdpProviderFactory {
    getIdpProvider(): Promise<IIdpProvider> | IIdpProvider;
}

export interface IIdpProvider {
    isApplicable(token: JwtPayload): boolean;
    getIdentity(token: string): Promise<IdentityData | null>;
}

export interface IOidcIdpConfig {
    getIdentity(token: JwtPayload): Promise<IdentityData> | IdentityData;
    verifyTokenClaims?(token: JwtPayload): Promise<JwtPayload> | JwtPayload;
    verifyToken?(token: string): Promise<JwtPayload> | JwtPayload;
}

export const IdpProviderFactory = createAbstraction<IIdpProviderFactory>("IdpProviderFactory");

export namespace IdpProviderFactory {
    export type Interface = IIdpProviderFactory;
}

export const IdpProvider = createAbstraction<IIdpProvider>("IdpProvider");

export namespace IdpProvider {
    export type Interface = IIdpProvider;
}

export const OidcIdpConfig = createAbstraction<IOidcIdpConfig>("OidcIdpConfig");

export namespace OidcIdpConfig {
    export type Interface = IOidcIdpConfig;
}
