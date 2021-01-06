import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as mime from "mime";
import * as path from "path";

class App {
    cloudfront: aws.cloudfront.Distribution;
    bucket: aws.s3.Bucket;
    constructor() {
        this.bucket = new aws.s3.Bucket("app", {
            acl: "public-read",
            website: {
                indexDocument: "index.html",
                errorDocument: "index.html"
            }
        });

        // Sync the contents of the source directory with the S3 bucket, which will in-turn show up on the CDN.
        const webContentsRootPath = path.join(__dirname, "..", "code", "build");
        App.crawlDirectory(webContentsRootPath, (filePath: string) => {
            const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");
            new aws.s3.BucketObject(
                relativeFilePath,
                {
                    key: relativeFilePath,
                    acl: "public-read",
                    bucket: this.bucket,
                    contentType: mime.getType(filePath) || undefined,
                    source: new pulumi.asset.FileAsset(filePath)
                },
                {
                    parent: this.bucket
                }
            );
        });

        this.cloudfront = new aws.cloudfront.Distribution("app", {
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
                }
            ],
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                targetOriginId: this.bucket.arn,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: false
                },
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

    static crawlDirectory(dir: string, f: (_: string) => void) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = `${dir}/${file}`;
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                App.crawlDirectory(filePath, f);
            }
            if (stat.isFile()) {
                f(filePath);
            }
        }
    }
}

export default App;
