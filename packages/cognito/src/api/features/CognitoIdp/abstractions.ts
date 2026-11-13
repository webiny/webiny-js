import { createAbstraction } from "@webiny/feature/api";
import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";

export type CognitoIdentity = Omit<IdentityData, "type"> & {
    profile?: Omit<IdentityData["profile"], "external">;
};

export interface ICognitoIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<CognitoIdentity> | CognitoIdentity;
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<void> | void;
    /**
     * For federated users, the token's "custom:id" must match a user ID in its "identities" claim
     * (default: true). Set to false only if "custom:id" is mapped to a different provider attribute,
     * and then verify "custom:id" in `verifyTokenClaims`: it stays writable by the user.
     */
    verifyFederatedCustomId?: boolean;
}

export const CognitoIdpConfig = createAbstraction<ICognitoIdpConfig>("CognitoIdpConfig");

export namespace CognitoIdpConfig {
    export type Interface = ICognitoIdpConfig;
    export type IdentityData = CognitoIdentity;
    export type JwtPayload = jwt.JwtPayload;
}
