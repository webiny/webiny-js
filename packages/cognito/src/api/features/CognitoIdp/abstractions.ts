import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export interface ICognitoIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<IdentityData> | IdentityData;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<jwt.JwtPayload> | jwt.JwtPayload;
    verifyToken?(token: string): Promise<jwt.JwtPayload> | jwt.JwtPayload;
}

export const CognitoIdpConfig = createAbstraction<ICognitoIdpConfig>("CognitoIdpConfig");

export namespace CognitoIdpConfig {
    export type Interface = ICognitoIdpConfig;
    export type JwtPayload = jwt.JwtPayload;
}
