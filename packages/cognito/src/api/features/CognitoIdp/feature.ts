import { createFeature } from "@webiny/feature/api";
import { CognitoIdentityProvider } from "./CognitoIdentityProvider.js";

export const CognitoIdpFeature = createFeature({
    name: "CognitoIdp",
    register(container) {
        // Registered in the root container, but its optional CognitoIdpConfig comes from extensions,
        // which register per request. A container-scoped instance is built from the request
        // container, so it sees that config; a singleton is built from the root and would not.
        container.register(CognitoIdentityProvider).inContainerScope();
    }
});
