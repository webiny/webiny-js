import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";
import { createAbstraction } from "@webiny/feature/api";

export type Auth0Identity = Omit<IdentityData, "type"> & {
    profile: Omit<IdentityData["profile"], "external">;
};

export interface IAuth0IdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<Auth0Identity> | Auth0Identity;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<void> | void;
}

export const Auth0IdpConfig = createAbstraction<IAuth0IdpConfig>("Auth0IdpConfig");

export namespace Auth0IdpConfig {
    export type Interface = IAuth0IdpConfig;
    export type IdentityData = Auth0Identity;
    export type JwtPayload = jwt.JwtPayload;
}
