import * as pulumi from "@pulumi/pulumi";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";
import { CognitoIdentityProviderConfig } from "./configure";

export const getAppleIdpConfig = (
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
): IdentityProviderArgs => {
    return {
        userPoolId,
        providerName: "Apple",
        providerType: "SignInWithApple",
        providerDetails: config.providerDetails,
        idpIdentifiers: config.idpIdentifiers,
        attributeMapping: {
            "custom:id": "sub",
            username: "sub",
            email: "email",
            given_name: "firstName",
            family_name: "lastName",
            ...config.attributeMapping
        }
    };
};
