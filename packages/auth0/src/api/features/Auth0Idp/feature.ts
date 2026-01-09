import { createFeature } from "@webiny/feature/api";
import { Auth0IdentityProvider } from "./Auth0IdentityProvider.js";

export const Auth0IdpFeature = createFeature({
    name: "Auth0Idp",
    register(container) {
        container.register(Auth0IdentityProvider).inSingletonScope();
    }
});
