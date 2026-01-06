import type { JwtPayload } from "jsonwebtoken";
import { IdpProviderFactory } from "@webiny/api-core/idp";
import { OidcIdpProvider } from "@webiny/api-core/idp";
import { jwksCache } from "@webiny/api-core/idp";
import { Auth0IdpConfig } from "./abstractions.js";

class Auth0IdpProviderFactoryImpl implements IdpProviderFactory.Interface {
    constructor(private config: Auth0IdpConfig.Interface) {}

    getIdpProvider(): OidcIdpProvider {
        return new OidcIdpProvider(
            {
                issuer: String(process.env.AUTH0_ISSUER),
                clientId: String(process.env.AUTH0_CLIENT_ID),
                config: this.config,
                isApplicable: (token: JwtPayload) => {
                    const issuer = token.iss as string;
                    if (!issuer) {
                        return false;
                    }

                    return new URL(issuer).hostname.includes("auth0.com") ?? false;
                }
            },
            jwksCache
        );
    }
}

export const Auth0IdpProviderFactory = IdpProviderFactory.createImplementation({
    implementation: Auth0IdpProviderFactoryImpl,
    dependencies: [Auth0IdpConfig]
});
