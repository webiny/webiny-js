import * as aws from "@pulumi/aws";

export interface CognitoOptions {
    /**
     * Don't allow to delete the resource.
     * Useful for production environments to avoid losing data.
     */
    protected: boolean;
}

export class Cognito {
    userPoolClient: aws.cognito.UserPoolClient;
    userPool: aws.cognito.UserPool;
    constructor(options: CognitoOptions) {
        this.userPool = new aws.cognito.UserPool(
            "user-pool",
            {
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
            { protect: options.protected }
        );

        this.userPoolClient = new aws.cognito.UserPoolClient("user-pool-client", {
            userPoolId: this.userPool.id
        });
    }
}
