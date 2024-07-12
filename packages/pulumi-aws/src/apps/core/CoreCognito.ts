import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

export interface CoreCognitoParams {
    protect: boolean;
    useEmailAsUsername: boolean;
}

export type CoreCognito = PulumiAppModule<typeof CoreCognito>;

export const CoreCognito = createAppModule({
    name: "Cognito",
    config(app: PulumiApp, params: CoreCognitoParams) {
        const userPool = app.addResource(aws.cognito.UserPool, {
            name: "user-pool",
            config: {
                passwordPolicy: {
                    minimumLength: 8,
                    requireLowercase: false,
                    requireNumbers: false,
                    requireSymbols: false,
                    requireUppercase: false,
                    temporaryPasswordValidityDays: 7
                },
                adminCreateUserConfig: {
                    allowAdminCreateUserOnly: true
                },
                autoVerifiedAttributes: ["email"],
                emailConfiguration: {
                    emailSendingAccount: "COGNITO_DEFAULT"
                },
                // In a legacy setup we use email as username.
                // We need to provide a way for users to have this setup,
                // because changing it would require whole cognito pool to be recreated.
                usernameAttributes: params.useEmailAsUsername ? ["email"] : undefined,
                aliasAttributes: params.useEmailAsUsername ? undefined : ["preferred_username"],
                lambdaConfig: {},
                mfaConfiguration: "OFF",
                userPoolAddOns: {
                    advancedSecurityMode: "OFF" /* required */
                },
                verificationMessageTemplate: {
                    defaultEmailOption: "CONFIRM_WITH_CODE"
                },
                accountRecoverySetting: {
                    recoveryMechanisms: [{ name: "verified_email", priority: 1 }]
                },
                schemas: [
                    {
                        attributeDataType: "String",
                        name: "email",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "family_name",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "given_name",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "id",
                        required: false,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "36",
                            minLength: "0"
                        }
                    }
                ]
            },
            opts: {
                protect: params.protect
            }
        });

        const userPoolClient = app.addResource(aws.cognito.UserPoolClient, {
            name: "user-pool-client",
            config: {
                userPoolId: userPool.output.id,
                accessTokenValidity: 60,
                idTokenValidity: 60,
                refreshTokenValidity: 30,
                tokenValidityUnits: {
                    accessToken: "minutes",
                    idToken: "minutes",
                    refreshToken: "days"
                }
            }
        });

        return {
            userPool,
            userPoolClient
        };
    }
});
