import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { ApplicationContext, loadGatewayConfig, PulumiApp } from "@webiny/pulumi-sdk";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface GatewayApiConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams;
}

export interface GatewayApiParams {
    name: string;
    config: GatewayApiConfig;
    viewerRequest: pulumi.Output<aws.cloudfront.Function>;
    viewerResponse: pulumi.Output<aws.cloudfront.Function>;
    originRequest: pulumi.Output<aws.lambda.Function>;
    configOriginRequest: pulumi.Output<aws.lambda.Function>;
}

export function createApiAppGateway(app: PulumiApp, params: GatewayApiParams) {
    // Currently we have an S3 bucket serving as cloudfront origin.
    // This bucket has only a single _config.json file containing variants configuration.

    // TODO: With WCP bucket is not needed, but we will need some placeholder for a default cloudfront behavior.
    const bucket = app.addResource(aws.s3.Bucket, {
        name: `${params.name}-gateway`,
        config: {
            acl: "public-read",
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "index.html"
            }
        }
    });

    // TODO: With WCP we will not need the config file. Config should be loaded from WCP API.
    app.addResource(aws.s3.BucketObject, {
        name: `${params.name}-gateway-config`,
        config: {
            bucket: bucket.output,
            acl: "public-read",
            key: "_config.json",
            content: pulumi.output(
                loadGatewayConfig({
                    app: params.name,
                    cwd: app.ctx.projectDir,
                    env: app.ctx.env
                }).then(JSON.stringify)
            ),
            contentType: "application/json",
            cacheControl: "public, max-age=31536000"
        }
    });

    const cloudfront = app.addResource(aws.cloudfront.Distribution, {
        name: `${params.name}-gateway-cdn`,
        config: {
            enabled: true,
            isIpv6Enabled: true,
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
                allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    headers: ["webiny-variant", "Accept", "Accept-Language"],
                    cookies: {
                        forward: "whitelist",
                        whitelistedNames: ["webiny-variant"]
                    },
                    queryString: true
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 0,
                maxTtl: 86400,
                functionAssociations: [
                    {
                        eventType: "viewer-request",
                        functionArn: params.viewerRequest.arn
                    },
                    {
                        eventType: "viewer-response",
                        functionArn: params.viewerResponse.arn
                    }
                ],
                lambdaFunctionAssociations: [
                    {
                        eventType: "origin-request",
                        lambdaArn: params.originRequest.qualifiedArn
                    }
                ]
            },
            orderedCacheBehaviors: [
                {
                    // This is a special behavior just to expose traffic splitting config file from S3 bucket.
                    // This is just for the sake of POC.
                    // TODO remove that behavior after implementing loading config from WCP
                    pathPattern: "/_config.json",
                    targetOriginId: bucket.output.arn,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    minTtl: 0,
                    defaultTtl: 600,
                    maxTtl: 600,
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        queryString: false
                    }
                },
                {
                    // This behavior is responsible for loading traffic splitting config from WCP
                    // and caching it approprietely within CloudFront.
                    pathPattern: "/_config",
                    targetOriginId: bucket.output.arn,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    minTtl: 0,
                    defaultTtl: 600,
                    maxTtl: 600,
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        queryString: false
                    },
                    lambdaFunctionAssociations: [
                        {
                            eventType: "origin-request",
                            lambdaArn: params.configOriginRequest.qualifiedArn
                        }
                    ]
                },
                {
                    pathPattern: "/files/*",
                    targetOriginId: bucket.output.arn,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        headers: ["webiny-variant", "Accept", "Accept-Language"],
                        cookies: {
                            forward: "whitelist",
                            whitelistedNames: ["webiny-variant"]
                        },
                        queryString: true
                    },
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 2592000,
                    functionAssociations: [
                        {
                            eventType: "viewer-request",
                            functionArn: params.viewerRequest.arn
                        },
                        {
                            eventType: "viewer-response",
                            functionArn: params.viewerResponse.arn
                        }
                    ],
                    lambdaFunctionAssociations: [
                        {
                            eventType: "origin-request",
                            lambdaArn: params.originRequest.qualifiedArn
                        }
                    ]
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

    const domain = params.config.domain?.(app.ctx);
    if (domain) {
        applyCustomDomain(cloudfront, domain);
    }

    app.addOutput(params.name, {
        appStorage: bucket.output.id,
        appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
    });
}
