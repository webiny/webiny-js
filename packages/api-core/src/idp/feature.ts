import { createFeature } from "@webiny/feature/api";
import { IdpAuthenticator } from "./IdpAuthenticator.js";

export const IdpAuthenticatorFeature = createFeature({
    name: "IdpAuthenticator",
    register(container) {
        container.register(IdpAuthenticator).inSingletonScope();
    }
});
