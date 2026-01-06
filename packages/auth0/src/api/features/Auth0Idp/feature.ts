import { createFeature } from "@webiny/feature/api";
import { Auth0IdpProviderFactory } from "./Auth0IdpProviderFactory.js";

export const Auth0IdpFeature = createFeature({
    name: "Auth0Idp",
    register(container) {
        container.register(Auth0IdpProviderFactory).inSingletonScope();
    }
});
