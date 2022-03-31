import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { ApplicationContext, loadGatewayConfig, PulumiApp } from "@webiny/pulumi-sdk";
import { createLambdas } from "./GatewayLambdas";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface GatewayApiConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams;
}

export interface GatewayApiParams {
    name: string;
    lambdas: ReturnType<typeof createLambdas>;
    config: GatewayApiConfig;
}

export function createApiAppGateway(app: PulumiApp, params: GatewayApiParams) {
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
                maxTtl: 86400
                // lambdaFunctionAssociations: [
                //     {
                //         eventType: "viewer-request",
                //         lambdaArn: params.lambdas.functions.pageViewerRequest.qualifiedArn
                //     },
                //     {
                //         eventType: "origin-response",
                //         lambdaArn: params.lambdas.functions.pageOriginResponse.qualifiedArn
                //     }
                // ]
            },
            orderedCacheBehaviors: [
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
                    maxTtl: 2592000
                    // lambdaFunctionAssociations: [
                    //     {
                    //         eventType: "viewer-request",
                    //         lambdaArn: params.lambdas.functions.pageViewerRequest.qualifiedArn
                    //     },
                    //     {
                    //         eventType: "origin-response",
                    //         lambdaArn: params.lambdas.functions.pageOriginResponse.qualifiedArn
                    //     }
                    // ]
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
