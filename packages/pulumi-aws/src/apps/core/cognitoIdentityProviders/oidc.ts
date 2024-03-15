import * as pulumi from "@pulumi/pulumi";
import { CognitoIdentityProviderConfig } from "./configure";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";

export const getOidcIdpConfig = (
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
): IdentityProviderArgs => {
    return {
        userPoolId,
        providerName: config.name || "OIDC",
        providerType: "OIDC",
        providerDetails: config.providerDetails,
        idpIdentifiers: config.idpIdentifiers,
        attributeMapping: {
            "custom:id": "sub",
            username: "sub",
            email: "email",
            given_name: "given_name",
            family_name: "family_name",
            preferred_username: "email",
            ...config.attributeMapping
        }
    };
};
