import { createAbstraction } from "@webiny/feature/api";
import type { JwtPayload } from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export interface IAuth0IdpConfig {
    getIdentity(token: JwtPayload): Promise<IdentityData> | IdentityData;
    verifyTokenClaims?(token: JwtPayload): Promise<JwtPayload> | JwtPayload;
    verifyToken?(token: string): Promise<JwtPayload> | JwtPayload;
}

export const Auth0IdpConfig = createAbstraction<IAuth0IdpConfig>("Auth0IdpConfig");

export namespace Auth0IdpConfig {
    export type Interface = IAuth0IdpConfig;
}
