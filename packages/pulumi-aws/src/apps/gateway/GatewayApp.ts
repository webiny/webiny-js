import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationConfig
} from "@webiny/pulumi-sdk";
import { buildLambdaEdge } from "@webiny/project-utils";

import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface GatewayAppConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams;
}

export const GatewayApp = defineApp({
    name: "Gateway",
    config(app, config: GatewayAppConfig) {
        const bucket = app.addResource(aws.s3.Bucket, {
            name: "admin-gateway",
            config: {
                acl: "public-read",
                forceDestroy: true,
                website: {
                    indexDocument: "index.html",
                    errorDocument: "index.html"
                }
            }
        });

        const role = app.addResource(aws.iam.Role, {
            name: `lambda-edge-role`,
            config: {
                managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
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

        // Some resources _must_ be put in us-east-1, such as Lambda at Edge.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const pageViewerRequest = createLambda("pageViewerRequest");
        const pageOriginRequest = createLambda("pageOriginRequest");
        const pageOriginResponse = createLambda("pageOriginResponse");
        const assetOriginRequest = createLambda("assetOriginRequest");

        const cloudfront = app.addResource(aws.cloudfront.Distribution, {
            name: "admin-gateway-cdn",
            config: {
                enabled: true,
                waitForDeployment: false,
                origins: [
                    {
                        originId: bucket.output.arn,
                        domainName: bucket.output.websiteEndpoint,
                        customOriginConfig: {
                            originProtocolPolicy: "http-only",
                            httpPort: 80,
                            httpsPort: 443,
                            originSslProtocols: ["TLSv1.2"]
                        }
                    }
                ],
                defaultCacheBehavior: {
                    compress: true,
                    targetOriginId: bucket.output.arn,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        headers: ["webiny-variant"],
                        cookies: {
                            forward: "whitelist",
                            whitelistedNames: ["webiny-variant"]
                        },
                        queryString: false
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 600,
                    maxTtl: 600,
                    lambdaFunctionAssociations: [
                        {
                            eventType: "viewer-request",
                            lambdaArn: pageViewerRequest.qualifiedArn
                        },
                        {
                            eventType: "origin-request",
                            lambdaArn: pageOriginRequest.qualifiedArn
                        },
                        {
                            eventType: "origin-response",
                            lambdaArn: pageOriginResponse.qualifiedArn
                        }
                    ]
                },
                orderedCacheBehaviors: [
                    {
                        pathPattern: "/_assets/*",
                        compress: true,
                        targetOriginId: bucket.output.arn,
                        viewerProtocolPolicy: "redirect-to-https",
                        allowedMethods: ["GET", "HEAD", "OPTIONS"],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: { forward: "none" },
                            queryString: false
                        },
                        lambdaFunctionAssociations: [
                            {
                                eventType: "origin-request",
                                lambdaArn: assetOriginRequest.qualifiedArn
                            }
                        ]
                    }
                ],
                priceClass: "PriceClass_100",
                customErrorResponses: [
                    { errorCode: 404, responseCode: 404, responsePagePath: "/index.html" }
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

        const domain = config.domain?.(app.ctx);
        if (domain) {
            applyCustomDomain(cloudfront, domain);
        }

        app.addOutputs({
            appStorage: bucket.output.id,
            appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
        });

        return {
            bucket,
            role,
            cloudfront,
            lambdaEdge: {
                pageViewerRequest,
                pageOriginRequest,
                pageOriginResponse,
                assetOriginRequest
            }
        };

        function createLambda(name: string) {
            const content = [
                `import { ${name} } from '@webiny/aws-helpers/stagedRollouts';`,
                `export default ${name}`
            ];
            const output = buildLambdaEdge(content.join("\n"));

            return new aws.lambda.Function(
                name,
                {
                    publish: true,
                    runtime: "nodejs14.x",
                    handler: "index.default",
                    role: role.output.arn,
                    timeout: 5,
                    memorySize: 128,
                    code: new pulumi.asset.AssetArchive({
                        "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
                    })
                },
                { provider: awsUsEast1 }
            );
        }
    }
});

export type GatewayApp = InstanceType<typeof GatewayApp>;

export function createGatewayApp(config: GatewayAppConfig & ApplicationConfig<GatewayApp>) {
    return createGenericApplication({
        id: "gateway",
        name: "gateway",
        description: "Your project's gateway area.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        app(ctx) {
            const app = new GatewayApp(ctx, config);
            config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
