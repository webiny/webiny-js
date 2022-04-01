import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { ApplicationContext, loadGatewayConfig, PulumiApp } from "@webiny/pulumi-sdk";
import { createLambdas } from "./GatewayLambdas";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface GatewayReactAppConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams;
}

export interface GatewayReactAppParams {
    name: string;
    lambdas: ReturnType<typeof createLambdas>;
    config: GatewayReactAppConfig;
}

export function createReactAppGateway(app: PulumiApp, params: GatewayReactAppParams) {
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
                    headers: ["webiny-variant-fixed", "webiny-variant-random"],
                    cookies: {
                        forward: "none"
                    },
                    queryString: false
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 600,
                maxTtl: 600,
                functionAssociations: [
                    {
                        eventType: "viewer-request",
                        functionArn: params.lambdas.functions.viewerRequest.arn
                    },
                    {
                        eventType: "viewer-response",
                        functionArn: params.lambdas.functions.viewerResponse.arn
                    }
                ],
                lambdaFunctionAssociations: [
                    {
                        eventType: "origin-request",
                        lambdaArn: params.lambdas.functions.pageOriginRequest.qualifiedArn
                    }
                ]
            },
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

    const domain = params.config.domain?.(app.ctx);
    if (domain) {
        applyCustomDomain(cloudfront, domain);
    }

    app.addOutput(params.name, {
        appStorage: bucket.output.id,
        appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
    });
}
