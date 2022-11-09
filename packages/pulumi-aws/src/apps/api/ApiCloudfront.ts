import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

import { ApiGateway } from "./ApiGateway";
import * as pulumi from "@pulumi/pulumi";
import { CoreOutput } from "~/apps";
import path from "path";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const gateway = app.getModule(ApiGateway);

        const PREFIX = "kobaja";
        const region = String(process.env.AWS_REGION);

        // Get Core app output
        const core = app.getModule(CoreOutput);

        // `primaryDynamodbTableName` is a string, hence the type cast here.
        const dynamoDbTable = core.primaryDynamodbTableName;

        // Because of JSON.stringify, we need to resolve promises upfront.
        const inlinePolicies = pulumi
            .all([aws.getCallerIdentity({}), dynamoDbTable])
            .apply(([identity, dynamoDbTable]) => [
                {
                    name: "tenant-router-policy",
                    policy: JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Sid: "PermissionForDynamodb",
                                Effect: "Allow",
                                Action: ["dynamodb:GetItem", "dynamodb:Query"],
                                Resource: [
                                    `arn:aws:dynamodb:${region}:${identity.accountId}:table/${dynamoDbTable}`,
                                    `arn:aws:dynamodb:${region}:${identity.accountId}:table/${dynamoDbTable}/*`
                                ]
                            }
                        ]
                    })
                }
            ]);

        const role = app.addResource(aws.iam.Role, {
            name: `${PREFIX}-role`,
            config: {
                inlinePolicies,
                managedPolicyArns: [
                    aws.iam.ManagedPolicies.AdministratorAccess,
                ],
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "sts:AssumeRole",
                            Principal: aws.iam.Principals.LambdaPrincipal,
                            Effect: "Allow"
                        },
                        {
                            Action: "sts:AssumeRole",
                            Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                            Effect: "Allow"
                        }
                    ]
                }
            }
        });

        const originLambda = app.addHandler(() => {
            const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

            return new aws.lambda.Function(
                `${PREFIX}-origin-request`,
                {
                    publish: true,
                    runtime: "nodejs14.x",
                    handler: "handler.handler",
                    role: role.output.arn,
                    timeout: 5,
                    memorySize: 128,
                    code: new pulumi.asset.AssetArchive({
                        ".": new pulumi.asset.FileArchive(
                            path.join(app.paths.workspace, "fileManager/filesOriginRequest/build")
                        )
                    })
                },
                {
                    provider: awsUsEast1
                }
            );
        });

        return app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            config: {
                waitForDeployment: false,
                isIpv6Enabled: true,
                enabled: true,
                defaultCacheBehavior: {
                    compress: true,
                    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        headers: ["Accept", "Accept-Language"],
                        queryString: true
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 86400,
                    targetOriginId: gateway.api.output.name,
                    viewerProtocolPolicy: "allow-all"
                },
                orderedCacheBehaviors: [
                    {
                        compress: true,
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: ["Accept", "Accept-Language"],
                            queryString: true
                        },
                        pathPattern: "/cms*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    },
                    {
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: ["Accept", "Accept-Language"],
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/files/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: "mujo",
                        lambdaFunctionAssociations: [
                            {
                                eventType: "origin-request",
                                includeBody: false,
                                lambdaArn: originLambda.qualifiedArn
                            }
                        ]
                    }
                ],
                origins: [
                    {
                        domainName: gateway.stage.output.invokeUrl.apply(
                            (url: string) => new URL(url).hostname
                        ),
                        originPath: gateway.stage.output.invokeUrl.apply(
                            (url: string) => new URL(url).pathname
                        ),
                        originId: gateway.api.output.name,
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        }
                    },
                    // <s3 object lambda access point name>-<account ID>.s3-object-lambda.<access point region>.amazonaws.com
                    {
                        originId: "mujo",
                        domainName: [
                            `fm-bucket-481f74a-object-lambda-ap-674320871285`,
                            `s3-object-lambda.eu-central-1.amazonaws.com`
                        ].join("."),
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        }
                    }
                ],
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            }
        });
    }
});
