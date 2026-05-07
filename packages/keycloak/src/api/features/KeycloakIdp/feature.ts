import { createFeature } from "@webiny/feature/api";
import { KeycloakIdentityProvider } from "./KeycloakIdentityProvider.js";

export const KeycloakIdpFeature = createFeature({
    name: "KeycloakIdp",
    register(container) {
        container.register(KeycloakIdentityProvider).inSingletonScope();
    }
});
