import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export interface IOktaIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<IdentityData> | IdentityData;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<jwt.JwtPayload> | jwt.JwtPayload;
    verifyToken?(token: string): Promise<jwt.JwtPayload> | jwt.JwtPayload;
}

export const OktaIdpConfig = createAbstraction<IOktaIdpConfig>("OktaIdpConfig");

export namespace OktaIdpConfig {
    export type Interface = IOktaIdpConfig;
    export type JwtPayload = jwt.JwtPayload;
}
