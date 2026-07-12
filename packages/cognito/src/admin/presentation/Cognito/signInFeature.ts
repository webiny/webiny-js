import { createFeature } from "@webiny/feature/admin";
import { DefaultCognitoSignInConfig } from "~/admin/DefaultCognitoSignInConfig.js";

export const CognitoSignInFeature = createFeature({
    name: "CognitoSignIn",
    register(container) {
        container.register(DefaultCognitoSignInConfig).inSingletonScope();
    }
});
