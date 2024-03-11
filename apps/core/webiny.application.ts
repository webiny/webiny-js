import { createCoreApp, configureAdminCognitoFederation } from "@webiny/serverless-cms-aws";

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi(app) {
        configureAdminCognitoFederation(app, {
            // Provide a name for the user pool domain.
            domain: "webiny-admin",
            // Whitelist callback URLs (can be localhost or real domain).
            callbackUrls: ["http://localhost:3001"],
            // Configure external identity providers.
            identityProviders: [
                {
                    name: "MyIDP",
                    type: "oidc",
                    providerDetails: {
                        attributes_request_method: "POST",
                        authorize_scopes: "email profile openid",
                        client_id: String(process.env.REMOTE_IDP_CLIENT_ID),
                        client_secret: String(process.env.REMOTE_IDP_CLIENT_SECRET),
                        oidc_issuer: String(process.env.REMOTE_IDP_ISSUER)
                    }
                }
            ]
        });
    }
});
