import React from "react";
import { Cognito } from "@webiny/cognito";

export const CognitoFederation = () => {
    return (
        <Cognito
            mfa={true}
            apiConfig={"@/extensions/idp/entraid/EntraIdApiConfig.ts"}
            federation={{
                domain: "myproj-webiny-with-entraid",
                callbackUrls: ["https://webiny-6.4.x.localhost"],
                responseType: "code",
                allowCredentialsLogin: true,
                identityProviders: [
                    {
                        name: "EntraID",
                        type: "oidc",
                        label: "Sign in with Microsoft",
                        providerDetails: {
                            attributes_request_method: "POST",
                            authorize_scopes: "email profile openid",
                            client_id: process.env.ENTRA_CLIENT_ID,
                            client_secret: process.env.ENTRA_CLIENT_SECRET,
                            oidc_issuer: process.env.ENTRA_OIDC_ISSUER
                        },
                        attributeMapping: {
                            "custom:id": "sub",
                            username: "sub",
                            email: "email",
                            given_name: "given_name",
                            family_name: "family_name",
                            preferred_username: "email"
                        }
                    }
                ]
            }}
        />
    );
};
