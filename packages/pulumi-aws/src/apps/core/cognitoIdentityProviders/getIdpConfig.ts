import * as pulumi from "@pulumi/pulumi";
import { CognitoIdentityProviderConfig } from "./configure";
import { getGoogleIdpConfig } from "./google";
import { getFacebookIdpConfig } from "./facebook";
import { getAppleIdpConfig } from "./apple";
import { getAmazonIdpConfig } from "./amazon";

const idpMap = {
    google: getGoogleIdpConfig,
    facebook: getFacebookIdpConfig,
    amazon: getAmazonIdpConfig,
    apple: getAppleIdpConfig
};

export const getIdpConfig = (
    type: CognitoIdentityProviderConfig["type"],
    userPoolId: pulumi.Input<string>,
    config: CognitoIdentityProviderConfig
) => {
    return idpMap[type](userPoolId, config);
};
