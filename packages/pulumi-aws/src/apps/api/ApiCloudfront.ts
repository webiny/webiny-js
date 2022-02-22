import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-sdk";

import { ApiGateway } from "./ApiGateway";

export interface ApiCloudfrontParams {
    apiGateway: ApiGateway;
}

export function createCloudfront(app: PulumiApp, params: ApiCloudfrontParams) {
    return app.addResource(aws.cloudfront.Distribution, {
        name: "api-cloudfront",
        config: {
            waitForDeployment: false,
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
                targetOriginId: params.apiGateway.api.output.name,
                viewerProtocolPolicy: "allow-all"
            },
            isIpv6Enabled: true,
            enabled: true,
            orderedCacheBehaviors: [
                {
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
                    pathPattern: "/cms*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: params.apiGateway.api.output.name
                },
                {
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
                    maxTtl: 2592000,
                    pathPattern: "/files/*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: params.apiGateway.api.output.name
                }
            ],
            origins: [
                {
                    domainName: params.apiGateway.defaultStage.output.invokeUrl.apply(
                        (url: string) => new URL(url).hostname
                    ),
                    originPath: params.apiGateway.defaultStage.output.invokeUrl.apply(
                        (url: string) => new URL(url).pathname
                    ),
                    originId: params.apiGateway.api.output.name,
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
