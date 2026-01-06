import { createFeature } from "@webiny/feature/api";
import { CognitoIdpProviderFactory } from "./CognitoIdpProviderFactory.js";
import { CognitoIdpConfig } from "./CognitoIdpConfig.js";

export const CognitoIdpFeature = createFeature({
    name: "CognitoIdp",
    register(container) {
        // Register default CognitoIdpConfig
        container.register(CognitoIdpConfig);

        // Register CognitoIdpProviderFactory in singleton scope
        container.register(CognitoIdpProviderFactory).inSingletonScope();
    }
});
