import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-sdk";

export function createCognitoResources(app: PulumiApp, params: { protect: boolean }) {
    const userPool = app.addResource(aws.cognito.UserPool, {
        name: "api-user-pool",
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
            lambdaConfig: {},
            mfaConfiguration: "OFF",
            userPoolAddOns: {
                advancedSecurityMode: "OFF" /* required */
            },
            usernameAttributes: ["email"],
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
        name: "api-user-pool-client",
        config: {
            userPoolId: userPool.output.id
        }
    });

    return {
        userPool,
        userPoolClient
    };
}
