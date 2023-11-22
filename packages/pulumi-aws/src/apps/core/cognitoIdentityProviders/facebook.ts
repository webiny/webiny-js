import * as pulumi from "@pulumi/pulumi";
import { CognitoIdentityProviderConfig } from "./configure";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";

export const getFacebookIdpConfig = (
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
): IdentityProviderArgs => {
    return {
        userPoolId,
        providerName: "Facebook",
        providerType: "Facebook",
        providerDetails: config.providerDetails,
        idpIdentifiers: config.idpIdentifiers,
        attributeMapping: {
            "custom:id": "id",
            username: "id",
            email: "email",
            given_name: "first_name",
            family_name: "last_name",
            ...config.attributeMapping
        }
    };
};
