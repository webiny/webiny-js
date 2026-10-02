import { createFeature } from "@webiny/feature/api";
import { JwtAuthenticator } from "./JwtAuthenticator.js";
import { JwksCache } from "./JwksCache.js";
import { OidcJwtIdentityProvider } from "~/idp/OidcJwtIdentityProvider.js";

export const IdpAuthenticatorFeature = createFeature({
    name: "IdpAuthenticator",
    register(container) {
        container.register(JwtAuthenticator);
        container.register(OidcJwtIdentityProvider);
        // Singleton, so the keys stay cached for the life of the process.
        container.register(JwksCache).inSingletonScope();
    }
});
