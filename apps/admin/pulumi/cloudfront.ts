import * as aws from "@pulumi/aws";

class Cloudfront {
    distribution: aws.cloudfront.Distribution;
    constructor({ appS3Bucket }: { appS3Bucket: aws.s3.Bucket }) {
        this.distribution = new aws.cloudfront.Distribution("admin-app-cdn", {
            enabled: true,
            waitForDeployment: false,
            origins: [
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
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                compress: true,
                targetOriginId: appS3Bucket.arn,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: false
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 600,
                maxTtl: 600
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

export default Cloudfront;
