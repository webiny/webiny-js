import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export interface IAuth0IdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<IdentityData> | IdentityData;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<jwt.JwtPayload> | jwt.JwtPayload;
    verifyToken?(token: string): Promise<jwt.JwtPayload> | jwt.JwtPayload;
}

export const Auth0IdpConfig = createAbstraction<IAuth0IdpConfig>("Auth0IdpConfig");

export namespace Auth0IdpConfig {
    export type Interface = IAuth0IdpConfig;
    export type JwtPayload = jwt.JwtPayload;
}
