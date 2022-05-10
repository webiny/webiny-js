import * as aws from "@pulumi/aws";
import { defineAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-sdk";

export interface StorageCognitoParams {
    protect: boolean;
    useEmailAsUsername: boolean;
}

export type StorageCognito = PulumiAppModule<typeof StorageCognito>;

export const StorageCognito = defineAppModule({
    name: "Cognito",
    config(app: PulumiApp, params: StorageCognitoParams) {
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
                userPoolId: userPool.output.id
            }
        });

        return {
            userPool,
            userPoolClient
        };
    }
});
