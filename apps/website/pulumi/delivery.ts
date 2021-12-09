import * as aws from "@pulumi/aws";
import { CloudFrontBucket } from "@webiny/pulumi-aws";

class Delivery {
    bucket: aws.s3.Bucket;
    cloudfront: aws.cloudfront.Distribution;
    constructor({ appS3Bucket }: { appS3Bucket: CloudFrontBucket }) {
        const bucket = new CloudFrontBucket("delivery");

        this.bucket = bucket.s3Bucket;

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
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 30,
                maxTtl: 30
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
            viewerCertificate: {
                cloudfrontDefaultCertificate: true
            }
        });
    }
}

export default Delivery;
