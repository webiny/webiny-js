import { createFeature } from "@webiny/feature/api";
import { SelfHostedJwtIdentityProvider } from "./SelfHostedJwtIdentityProvider.js";

export const SelfHostedIdpFeature = createFeature({
    name: "SelfHostedIdp",
    register(container) {
        // Registered alongside any other JwtIdentityProvider (Cognito, Auth0, …);
        // the JwtAuthenticator tries each until one claims the token.
        // Registered in the root container, but its TokenIssuer reads the signing secret from
        // BuildParams, which is registered per request. A container-scoped instance is built from
        // the request container, so it sees BuildParams; a singleton is built from the root and
        // would not.
        container.register(SelfHostedJwtIdentityProvider).inContainerScope();
    }
});
