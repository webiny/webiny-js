import { createFeature } from "@webiny/feature/api";
import { SelfHostedJwtIdentityProvider } from "./SelfHostedJwtIdentityProvider.js";

export const SelfHostedIdpFeature = createFeature({
    name: "SelfHostedIdp",
    register(container) {
        // Registered alongside any other JwtIdentityProvider (Cognito, Auth0, …);
        // the JwtAuthenticator tries each until one claims the token.
        container.register(SelfHostedJwtIdentityProvider).inSingletonScope();
    }
});
