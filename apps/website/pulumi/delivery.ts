import * as aws from "@pulumi/aws";
// import * as pulumi from "@pulumi/pulumi";
// import { WebsiteTenantRouter } from "@webiny/pulumi-aws";

class Delivery {
    bucket: aws.s3.Bucket;
    cloudfront: aws.cloudfront.Distribution;
    constructor({ appS3Bucket }: { appS3Bucket: aws.s3.Bucket }) {
        this.bucket = new aws.s3.Bucket("delivery", {
            acl: "public-read",
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "_NOT_FOUND_PAGE_/index.html"
            }
        });

        // const websiteRouter = new WebsiteTenantRouter("website-router");

        this.cloudfront = new aws.cloudfront.Distribution("delivery", {
            enabled: true,
            waitForDeployment: true,
            origins: [
                {
                    originId: this.bucket.arn,
                    domainName: this.bucket.websiteEndpoint,
                    customOriginConfig: {
                        originProtocolPolicy: "http-only",
                        httpPort: 80,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"]
                    }
                },
                {
                    originId: appS3Bucket.arn,
                    domainName: appS3Bucket.websiteEndpoint,
                    customOriginConfig: {
                        originProtocolPolicy: "http-only",
                        httpPort: 80,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"]
                    }
                }
            ],
            orderedCacheBehaviors: [
                {
                    compress: true,
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        headers: [],
                        queryString: false
                    },
                    pathPattern: "/static/*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: appS3Bucket.arn,
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 2592000, // 30 days
                    maxTtl: 2592000
                }
            ],
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                compress: true,
                targetOriginId: this.bucket.arn,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                originRequestPolicyId: "",
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: true
                    // headers: ["Host"]
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 30,
                maxTtl: 30
                // lambdaFunctionAssociations: [
                //     {
                //         eventType: "origin-request",
                //         includeBody: false,
                //         lambdaArn: pulumi.interpolate`${websiteRouter.originRequest.qualifiedArn}`
                //     }
                // ]
            },
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                }
            },
            // aliases: ["*.mt2.webiny.com"],
            viewerCertificate: {
                cloudfrontDefaultCertificate: true
                // sslSupportMethod: "sni-only",
                // acmCertificateArn:
                //     "arn:aws:acm:us-east-1:656932293860:certificate/eb47f296-39c3-44df-a04e-f25f4f339e17"
            }
        });
    }
}

export default Delivery;
