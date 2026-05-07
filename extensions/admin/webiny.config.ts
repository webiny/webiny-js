import { createBuildAdmin } from "@webiny/build-tools";

// Default container-mode values for the build-time env vars baked into
// the SPA. Overridable via the shell — set REACT_APP_* before running
// `yarn build:admin` if you point at a different Keycloak / API origin.
//
// The defaults match docker-compose.yml: api on :8080, Keycloak on :8180
// (realm "webiny", public client "webiny-api"). The IdP type switch in
// app-admin keys off REACT_APP_IDP_TYPE; "keycloak" hides the Cognito-
// specific admin-account installer step.
const defaults: Record<string, string> = {
    REACT_APP_GRAPHQL_API_URL: "http://localhost:8080/graphql",
    REACT_APP_KEYCLOAK_ISSUER: "http://localhost:8180/realms/webiny",
    REACT_APP_KEYCLOAK_CLIENT_ID: "webiny-api",
    REACT_APP_IDP_TYPE: "keycloak"
};

for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) {
        process.env[key] = value;
    }
}

export default {
    commands: {
        build: createBuildAdmin({ cwd: import.meta.dirname })
    }
};
