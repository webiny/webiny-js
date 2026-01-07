import { createFeature } from "@webiny/feature/api";
import { CognitoIdentityProvider } from "./CognitoIdentityProvider.js";

export const CognitoIdpFeature = createFeature({
    name: "CognitoIdp",
    register(container) {
        container.register(CognitoIdentityProvider).inSingletonScope();
    }
});
