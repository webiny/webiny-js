import type jwt from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";
import { createAbstraction } from "@webiny/feature/api";

export type KeycloakIdentity = Omit<IdentityData, "type"> & {
    profile: Omit<IdentityData["profile"], "external">;
};

export interface IKeycloakIdpConfig {
    /**
     * Map a Keycloak-issued JWT payload to a Webiny identity. The default
     * payload from a Keycloak access token includes `sub`, `email`,
     * `preferred_username`, `name`, `realm_access.roles`, etc. — pick what
     * you need.
     */
    getIdentity(token: jwt.JwtPayload): Promise<KeycloakIdentity> | KeycloakIdentity;
    /**
     * Optional extra validation beyond signature + standard OIDC claims —
     * for example, asserting a specific audience or required role.
     */
    verifyTokenClaims?(token: jwt.JwtPayload): Promise<void> | void;
}

export const KeycloakIdpConfig = createAbstraction<IKeycloakIdpConfig>("KeycloakIdpConfig");

export namespace KeycloakIdpConfig {
    export type Interface = IKeycloakIdpConfig;
    export type IdentityData = KeycloakIdentity;
    export type JwtPayload = jwt.JwtPayload;
}
