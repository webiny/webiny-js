import { createFeature } from "@webiny/feature/api";
import { CognitoIdentityProvider } from "./CognitoIdentityProvider.js";

export const CognitoIdpFeature = createFeature({
    name: "CognitoIdp",
    register(container) {
        // Registered per request by CognitoApiFeature (the `<Cognito/>` extension). Container scoped:
        // one provider per request, built from the request container, so it sees the optional
        // CognitoIdpConfig that other extensions (e.g. Entra ID) register there.
        container.register(CognitoIdentityProvider).inContainerScope();
    }
});
