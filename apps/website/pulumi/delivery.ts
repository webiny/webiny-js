import * as aws from "@pulumi/aws";
import { CloudFrontBucket } from "@webiny/pulumi-aws";
// import * as pulumi from "@pulumi/pulumi";
// import { WebsiteTenantRouter } from "@webiny/pulumi-aws";

class Delivery {
    bucket: aws.s3.Bucket;
    cloudfront: aws.cloudfront.Distribution;
    constructor({ appS3Bucket }: { appS3Bucket: CloudFrontBucket }) {
        const bucket = new CloudFrontBucket("delivery");

        this.bucket = bucket.s3Bucket;

        // const websiteRouter = new WebsiteTenantRouter("website-router");

        this.cloudfront = new aws.cloudfront.Distribution("delivery", {
            enabled: true,
            waitForDeployment: true,
            origins: [bucket.origin, appS3Bucket.origin],
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
                    targetOriginId: bucket.origin.originId,
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 2592000, // 30 days
                    maxTtl: 2592000
                }
            ],
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                compress: true,
                targetOriginId: bucket.origin.originId,
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
            customErrorResponses: [
                {
                    errorCode: 404,
                    responseCode: 404,
                    responsePagePath: "/_NOT_FOUND_PAGE_/index.html"
                }
            ],
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
