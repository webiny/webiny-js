import * as pulumi from "@pulumi/pulumi";
import { IdentityProviderArgs } from "@pulumi/aws/cognito";
import { CognitoIdentityProviderConfig } from "./configure";

/**
 * Amazon doesn't provide first/last name as separate attributes. Instead, it gives you a `name`.
 * To handle this, developers will need to set up a pre-authentication Lambda trigger on the user pool,
 * to generate proper first/last name using custom code.
 */
export const getAmazonIdpConfig = (
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
): IdentityProviderArgs => {
    return {
        userPoolId,
        providerName: "Amazon",
        providerType: "LoginWithAmazon",
        providerDetails: config.providerDetails,
        idpIdentifiers: config.idpIdentifiers,
        attributeMapping: {
            "custom:id": "user_id",
            username: "user_id",
            email: "email",
            given_name: "name",
            family_name: "name",
            ...config.attributeMapping
        }
    };
};
