import React from "react";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { Keycloak } from "./Keycloak.js";
import { KeycloakFeature } from "./features/Keycloak/feature.js";

/**
 * Top-level admin extension for Keycloak. Used by Phase 3b's app-admin
 * IdP-type switch — when `REACT_APP_IDP_TYPE === "keycloak"`, this
 * component is mounted and reads the realm + client from the build-time
 * env vars.
 */
export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={KeycloakFeature} />
            <Keycloak
                keycloak={{
                    issuer: String(process.env.REACT_APP_KEYCLOAK_ISSUER),
                    clientId: String(process.env.REACT_APP_KEYCLOAK_CLIENT_ID)
                }}
            />
        </>
    );
};
