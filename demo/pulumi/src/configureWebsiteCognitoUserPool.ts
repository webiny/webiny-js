import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { CorePulumiApp } from "@webiny/pulumi-aws";

export type CustomCoreOutput = {
    websiteUserPoolId: string;
    websiteUserPoolRegion: string;
    websiteUserPoolClient: string;
    websiteUserPoolArn: string;
};

export const configureWebsiteCognitoUserPool = (app: CorePulumiApp) => {
    const role = app.addResource(aws.iam.Role, {
        name: "cognito-user-pool-handlers-role",
        config: {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        },
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const preSignupHandler = app.addResource(aws.lambda.Function, {
        name: "cognito-user-pool-pre-signup",
        config: {
            runtime: aws.lambda.Runtime.NodeJS18dX,
            handler: "handler.handler",
            description: "Cognito User Pool - Pre-signup Handler",
            role: role.output.arn,
            timeout: 30,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(__dirname + "/cognitoUserPoolPreSignup")
            }),
            environment: {
                variables: {
                    env: app.params.run["env"]
                }
            }
        }
    });

    const userPool = app.addResource(aws.cognito.UserPool, {
        name: "demo-website-users",
        config: {
            // Build error fix - website-users Invalid Parameter
            accountRecoverySetting: {
                recoveryMechanisms: [
                    {
                        name: "verified_email",
                        priority: 1
                    }
                ]
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
                    name: "wby_user_id",
                    required: false,
                    developerOnlyAttribute: false,
                    mutable: true,
                    stringAttributeConstraints: {
                        maxLength: "30",
                        minLength: "0"
                    }
                }
            ],
            passwordPolicy: {
                minimumLength: 8,
                requireLowercase: false,
                requireNumbers: false,
                requireSymbols: false,
                requireUppercase: false,
                temporaryPasswordValidityDays: 7
            },
            autoVerifiedAttributes: ["email"],
            aliasAttributes: ["preferred_username"],
            lambdaConfig: {
                preSignUp: preSignupHandler.output.arn
            }
        }
    });

    const userPoolClient = app.addResource(aws.cognito.UserPoolClient, {
        name: "website",
        config: {
            userPoolId: userPool.output.id,
            explicitAuthFlows: [
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_CUSTOM_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH"
            ],
            supportedIdentityProviders: ["COGNITO"]
        }
    });

    app.addResource(aws.lambda.Permission, {
        name: "allow-cognito-pre-signup",
        config: {
            action: "lambda:InvokeFunction",
            function: preSignupHandler.output.arn,
            principal: "cognito-idp.amazonaws.com",
            sourceArn: userPool.output.arn
        }
    });

    app.addOutputs({
        websiteUserPoolId: userPool.output.id,
        websiteUserPoolRegion: String(process.env.AWS_REGION),
        websiteUserPoolArn: userPool.output.arn,
        websiteUserPoolClient: userPoolClient.output.id
    });
};
