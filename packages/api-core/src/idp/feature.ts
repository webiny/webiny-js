import { createFeature } from "@webiny/feature/api";
import { JwtAuthenticator } from "./JwtAuthenticator.js";
import { JwkCache } from "./abstractions.js";
import { JwksCache } from "./JwksCache.js";
import { OidcJwtIdentityProvider } from "~/idp/OidcJwtIdentityProvider.js";

export const IdpAuthenticatorFeature = createFeature({
    name: "IdpAuthenticator",
    register(container) {
        container.register(JwtAuthenticator);
        container.register(OidcJwtIdentityProvider);
        container.registerInstance(JwkCache, new JwksCache());
    }
});
