import * as aws from "@pulumi/aws";
import ApiGateway from "./apiGateway";
import { parse } from "url";

class Cloudfront {
    cloudfront: aws.cloudfront.Distribution;
    constructor({ apiGateway }: { apiGateway: ApiGateway }) {
        this.cloudfront = new aws.cloudfront.Distribution("api-cloudfront", {
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
                targetOriginId: apiGateway.api.name,
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
                    targetOriginId: apiGateway.api.name
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
                    targetOriginId: apiGateway.api.name
                }
            ],
            origins: [
                {
                    domainName: apiGateway.defaultStage.invokeUrl.apply((url: string) =>
                        String(parse(url).hostname)
                    ),
                    originPath: apiGateway.defaultStage.invokeUrl.apply((url: string) =>
                        String(parse(url).pathname)
                    ),
                    originId: apiGateway.api.name,
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
        });
    }
}

export default Cloudfront;
