import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export type OktaIdentity = Omit<IdentityData, "type"> & {
    profile: Omit<IdentityData["profile"], "external">;
};

export interface IOktaIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<OktaIdentity> | OktaIdentity;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<void> | void;
}

export const OktaIdpConfig = createAbstraction<IOktaIdpConfig>("OktaIdpConfig");

export namespace OktaIdpConfig {
    export type Interface = IOktaIdpConfig;
    export type IdentityData = OktaIdentity;
    export type JwtPayload = jwt.JwtPayload;
}
