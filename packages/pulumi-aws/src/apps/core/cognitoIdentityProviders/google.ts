import * as pulumi from "@pulumi/pulumi";
import { CognitoIdentityProviderConfig } from "./configure";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";

export const getGoogleIdpConfig = (
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
): IdentityProviderArgs => {
    return {
        userPoolId,
        providerName: "Google",
        providerType: "Google",
        providerDetails: config.providerDetails,
        idpIdentifiers: config.idpIdentifiers,
        attributeMapping: {
            "custom:id": "sub",
            username: "sub",
            email: "email",
            given_name: "given_name",
            family_name: "family_name",
            ...config.attributeMapping
        }
    };
};
