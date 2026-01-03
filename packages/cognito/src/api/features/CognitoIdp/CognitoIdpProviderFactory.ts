import type { JwtPayload } from "jsonwebtoken";
import { IdpProviderFactory } from "@webiny/api-core/idp";
import { OidcIdpProvider } from "@webiny/api-core/idp";
import { jwksCache } from "@webiny/api-core/idp";
import { CognitoIdpConfig } from "./abstractions.js";

class CognitoIdpProviderFactoryImpl implements IdpProviderFactory.Interface {
    constructor(private config: CognitoIdpConfig.Interface) {}

    getIdpProvider(): OidcIdpProvider {
        const region = String(process.env.COGNITO_REGION);
        const userPoolId = String(process.env.COGNITO_USER_POOL_ID);
        const clientId = String(process.env.COGNITO_CLIENT_ID);

        // Cognito issuer format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}
        const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        return new OidcIdpProvider(
            {
                issuer,
                clientId,
                config: this.config,
                isApplicable: (token: JwtPayload) => {
                    const tokenIssuer = token.iss as string;

                    return (
                        tokenIssuer.includes("cognito-idp") || tokenIssuer.includes("amazonaws.com")
                    );
                }
            },
            jwksCache
        );
    }
}

export const CognitoIdpProviderFactory = IdpProviderFactory.createImplementation({
    implementation: CognitoIdpProviderFactoryImpl,
    dependencies: [CognitoIdpConfig]
});
