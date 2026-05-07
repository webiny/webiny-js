import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KeycloakIdpConfig, KeycloakIdpFeature } from "@webiny/keycloak";
import type { IKeycloakIdpConfig, KeycloakIdentity } from "@webiny/keycloak";

// `jwt.JwtPayload` is re-exported through `KeycloakIdpConfig.JwtPayload`,
// so this file doesn't import `jsonwebtoken` directly — keeps adio happy
// without adding a runtime dep just for a type alias.
type JwtPayload = KeycloakIdpConfig.JwtPayload;

/**
 * Default claim → Webiny identity mapper. Reads standard OIDC claims
 * (`sub`, `email`, `preferred_username`, `name`, `given_name`,
 * `family_name`).
 *
 * Identity id strategy: **email** rather than `sub`. The container's
 * boot-time bootstrap (`server.ts`) seeds a single Webiny admin-user
 * keyed by email; using email here keeps the per-request identity in
 * lockstep with the bootstrapped row without needing to query Keycloak's
 * Admin API for the `sub`. POC simplification — production-grade JIT
 * provisioning would key on `sub` and create the user record on first
 * login. Customers wanting that behavior register a different
 * `KeycloakIdpConfig` before this plugin runs.
 */
class DefaultKeycloakIdpConfig implements IKeycloakIdpConfig {
    public getIdentity(token: JwtPayload): KeycloakIdentity {
        const sub = String(token.sub ?? "");
        const email = (token["email"] as string | undefined) ?? "";
        const preferredUsername = (token["preferred_username"] as string | undefined) ?? "";
        const name = (token["name"] as string | undefined) ?? "";
        const givenName = (token["given_name"] as string | undefined) ?? "";
        const familyName = (token["family_name"] as string | undefined) ?? "";

        return {
            // Email-as-id keeps the per-request identity matched to the
            // Webiny admin-user row bootstrapped at container start.
            id: email || sub,
            displayName: name || preferredUsername || email || sub,
            profile: {
                email,
                firstName: givenName,
                lastName: familyName
            }
        } as KeycloakIdentity;
    }
}

/**
 * Registers the Keycloak OIDC identity provider with the api-core IdP
 * authenticator. Reads `KEYCLOAK_ISSUER` and `KEYCLOAK_CLIENT_ID` from the
 * environment (set in docker-compose.yml).
 *
 * After this is wired, requests with `Authorization: Bearer <jwt>` get
 * past the JWT validator if the token was issued by the configured
 * Keycloak realm. The matching Webiny admin-user row is bootstrapped at
 * container start in `server.ts` (Phase 2).
 */
export const createKeycloakAuth = () => {
    return createRegisterExtensionPlugin(context => {
        context.container.registerInstance(KeycloakIdpConfig, new DefaultKeycloakIdpConfig());
        KeycloakIdpFeature.register(context.container);
    });
};
