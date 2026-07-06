import { AdminBeforeWatch } from "@webiny/project/abstractions/index.js";

/**
 * Server flavour: hand the admin app the API URL before `webiny watch admin`.
 *
 * There is no Pulumi stack output here (unlike the AWS flavour's SetAdminEnvVars, which reads
 * `apiUrl` from ApiStackOutputService), so the URL is resolved by convention:
 *   - an explicit WEBINY_API_URL wins (e.g. a deployed public URL), otherwise
 *   - http://localhost:<WEBINY_API_PORT | 3000> — the same port `watch api` (startApiServer) binds.
 *
 * Also pins the admin dev-server port to WEBINY_ADMIN_PORT | 3001 so it doesn't collide with the
 * API server: both previously defaulted to 3000 (the API via startApiServer, admin via the dev
 * server default). Explicit env vars are never overridden, so users can pin any of these.
 */
class SetServerAdminEnvVarsBeforeWatchImpl implements AdminBeforeWatch.Interface {
    async execute() {
        const apiPort = process.env.WEBINY_API_PORT || "3000";
        const apiUrl = process.env.WEBINY_API_URL || `http://localhost:${apiPort}`;

        if (!process.env.REACT_APP_API_URL) {
            process.env.REACT_APP_API_URL = apiUrl;
        }

        if (!process.env.REACT_APP_GRAPHQL_API_URL) {
            process.env.REACT_APP_GRAPHQL_API_URL = `${apiUrl}/graphql`;
        }

        // Tell the install wizard's admin-user step to key its data under the self-hosted IdP's
        // AppInstaller name ("SelfHostedAuth"), so the install actually seeds the admin user +
        // password. Without this it defaults to "Cognito" and the self-hosted installer never runs.
        if (!process.env.REACT_APP_AUTH_INSTALLER_APP_NAME) {
            process.env.REACT_APP_AUTH_INSTALLER_APP_NAME = "SelfHostedAuth";
        }

        // Keep the admin dev server off the API server's port.
        process.env.PORT = process.env.WEBINY_ADMIN_PORT || "3001";
    }
}

export const SetServerAdminEnvVarsBeforeWatch = AdminBeforeWatch.createImplementation({
    implementation: SetServerAdminEnvVarsBeforeWatchImpl,
    dependencies: []
});
