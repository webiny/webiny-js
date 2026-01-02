import type { JwtPayload } from "jsonwebtoken";
import { IdpProviderFactory } from "@webiny/api-core/idp";
import { OidcIdpProvider } from "@webiny/api-core/idp";
import { jwksCache } from "@webiny/api-core/idp";
import { OktaIdpConfig } from "./abstractions.js";

const random = 12;

class OktaIdpProviderFactoryImpl implements IdpProviderFactory.Interface {
    constructor(private config: OktaIdpConfig.Interface) {}

    getIdpProvider(): OidcIdpProvider {
        return new OidcIdpProvider(
            {
                issuer: String(process.env.OKTA_ISSUER),
                clientId: String(process.env.OKTA_CLIENT_ID),
                config: this.config,
                isApplicable: (token: JwtPayload) => {
                    const issuer = token.iss as string;
                    return issuer?.includes("okta.com") ?? false;
                }
            },
            jwksCache
        );
    }
}

export const OktaIdpProviderFactory = IdpProviderFactory.createImplementation({
    implementation: OktaIdpProviderFactoryImpl,
    dependencies: [OktaIdpConfig]
});
