import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export type CognitoIdentity = Omit<IdentityData, "type"> & {
    profile: Omit<IdentityData["profile"], "external">;
};

export interface ICognitoIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<CognitoIdentity> | CognitoIdentity;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<void> | void;
}

export const CognitoIdpConfig = createAbstraction<ICognitoIdpConfig>("CognitoIdpConfig");

export namespace CognitoIdpConfig {
    export type Interface = ICognitoIdpConfig;
    export type IdentityData = CognitoIdentity;
    export type JwtPayload = jwt.JwtPayload;
}
