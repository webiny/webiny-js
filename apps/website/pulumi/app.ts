import * as aws from "@pulumi/aws";
import { CloudFrontBucket } from "@webiny/pulumi-aws";

class App {
    cloudfront: aws.cloudfront.Distribution;
    bucket: CloudFrontBucket;
    constructor() {
        this.bucket = new CloudFrontBucket("app");

        this.cloudfront = new aws.cloudfront.Distribution("app", {
            enabled: true,
            waitForDeployment: true,
            origins: [this.bucket.origin],
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                compress: true,
                targetOriginId: this.bucket.origin.originId,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: false
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 0,
                maxTtl: 0
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
        });
    }
}

export default App;
