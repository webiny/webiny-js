import * as aws from "@pulumi/aws";
import { createAppModule, type PulumiApp, type PulumiAppModule } from "@webiny/pulumi";

export interface CoreCognitoParams {
    protect: boolean;
    useEmailAsUsername: boolean;
    mfa?: boolean;
}

export type CoreCognito = PulumiAppModule<typeof CoreCognito>;

/**
 * Attributes users may change themselves (with their own access token). `custom:id` is the
 * Webiny identity id, so it must never be in this list: a user who could write it would sign in
 * as any other user. Required attributes have to stay writable. Federated identity providers
 * add the attributes they map (see `cognitoIdentityProviders/configure.ts`).
 */
export const USER_WRITABLE_ATTRIBUTES = ["email", "family_name", "given_name"];

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
                mfaConfiguration: params.mfa ? "ON" : "OFF",
                softwareTokenMfaConfiguration: params.mfa ? { enabled: true } : undefined,
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
                writeAttributes: USER_WRITABLE_ATTRIBUTES,
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
