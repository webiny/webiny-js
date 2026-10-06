import { createFeature } from "@webiny/feature/api";
import { JwtAuthenticator } from "./JwtAuthenticator.js";
import { JwksCache } from "./JwksCache.js";
import { OidcJwtIdentityProvider } from "~/idp/OidcJwtIdentityProvider.js";

export const IdpAuthenticatorFeature = createFeature({
    name: "IdpAuthenticator",
    register(container) {
        container.register(JwtAuthenticator);
        container.register(OidcJwtIdentityProvider);
        // Per request. The keys outlive it through JwksStore, which belongs in the root container
        // (JwksStoreFeature).
        container.register(JwksCache).inSingletonScope();
    }
});
