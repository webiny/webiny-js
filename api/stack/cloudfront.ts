import * as aws from "@pulumi/aws";
import { parse } from "url";
import * as awsx from "@pulumi/awsx";

class Cloudfront {
    cloudfront: aws.cloudfront.Distribution;
    constructor({ apiGateway }: { apiGateway: awsx.apigateway.API }) {
        this.cloudfront = new aws.cloudfront.Distribution("api-cloudfront", {
            waitForDeployment: false,
            defaultCacheBehavior: {
                allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                defaultTtl: 0,
                forwardedValues: {
                    cookies: {
                        forward: "none"
                    },
                    headers: ["Accept", "Accept-Language"],
                    queryString: true
                },
                compress: true,
                maxTtl: 86400,
                minTtl: 0,
                targetOriginId: apiGateway.restAPI.name,
                viewerProtocolPolicy: "allow-all"
            },
            isIpv6Enabled: true,
            enabled: true,
            orderedCacheBehaviors: [
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
                    pathPattern: "/cms*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: apiGateway.restAPI.name
                },
                {
                    defaultTtl: 2592000,
                    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        headers: ["Accept", "Accept-Language"],
                        queryString: true
                    },
                    pathPattern: "/files/*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: apiGateway.restAPI.name
                }
            ],
            origins: [
                {
                    domainName: apiGateway.url.apply((url: string) => String(parse(url).hostname)),
                    originPath: "/default",
                    originId: apiGateway.restAPI.name,
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
