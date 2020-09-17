import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as mime from "mime";
import * as path from "path";

const adminAppBucket = new aws.s3.Bucket("admin-app", {
    acl: "public-read",
    website: {
        indexDocument: "index.html",
        errorDocument: "index.html"
    }
});

// crawlDirectory recursive crawls the provided directory, applying the provided function
// to every file it contains. Doesn't handle cycles from symlinks.
function crawlDirectory(dir: string, f: (_: string) => void) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            crawlDirectory(filePath, f);
        }
        if (stat.isFile()) {
            f(filePath);
        }
    }
}

// Sync the contents of the source directory with the S3 bucket, which will in-turn show up on the CDN.
const webContentsRootPath = path.join(__dirname, "code", "app", "build");
crawlDirectory(webContentsRootPath, (filePath: string) => {
    const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");
    new aws.s3.BucketObject(
        relativeFilePath,
        {
            key: relativeFilePath,
            acl: "public-read",
            bucket: adminAppBucket,
            contentType: mime.getType(filePath) || undefined,
            source: new pulumi.asset.FileAsset(filePath)
        },
        {
            parent: adminAppBucket
        }
    );
});

const cdn = new aws.cloudfront.Distribution("admin-app-cdn", {
    enabled: true,
    waitForDeployment: false,
    origins: [
        {
            originId: adminAppBucket.arn,
            domainName: adminAppBucket.websiteEndpoint,
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
        targetOriginId: adminAppBucket.arn,
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
    customErrorResponses: [{ errorCode: 404, responseCode: 404, responsePagePath: "/index.html" }],
    restrictions: {
        geoRestriction: {
            restrictionType: "none"
        }
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true
    }
});

export const CDN = cdn.domainName;
