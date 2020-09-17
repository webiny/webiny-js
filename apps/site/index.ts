import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as mime from "mime";
import * as path from "path";
import * as awsx from "@pulumi/awsx";

// TODO: AdministratorAccess?
const defaultLambdaRole = new aws.iam.Role("default-lambda-role", {
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Principal: {
                    Service: "lambda.amazonaws.com"
                },
                Effect: "Allow"
            }
        ]
    }
});

new aws.iam.RolePolicyAttachment("default-lambda-role-policy", {
    role: defaultLambdaRole,
    policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
});

// ------------------------------------------------------------------------------------------
//                                      DB Proxy
// ------------------------------------------------------------------------------------------

const defaults = {
    function: {
        runtime: "nodejs12.x",
        handler: "handler.handler",
        role: defaultLambdaRole.arn,
        timeout: 30,
        memorySize: 512
    }
};

const dbProxy = new aws.lambda.Function("db-proxy", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/databaseProxy/build")
    }),
    description: "Handles interaction with MongoDB",
    environment: {
        variables: {
            MONGODB_SERVER: String(process.env.MONGODB_SERVER),
            MONGODB_NAME: String(process.env.MONGODB_NAME)
        }
    }
});

const siteSsr = new aws.lambda.Function("site-ssr", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/app/build-ssr")
    }),
    memorySize: 2048,
    timeout: 60,
    description: "Site SSR",
    environment: {
        variables: {
            SSR_FUNCTION: "${siteSsr.arn}",
            DB_PROXY_FUNCTION: "${databaseProxy.arn}"
        }
    }
});

const site = new aws.lambda.Function("site", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/databaseProxy/build")
    }),
    description: "Webiny Site",
    memorySize: 128,
    environment: {
        variables: {
            SSR_FUNCTION: siteSsr.arn,
            DB_PROXY_FUNCTION: dbProxy.arn
        }
    }
});

const apiGateway = new awsx.apigateway.API("apps-api-gateway", {
    stageName: "default",
    restApiArgs: {
        description: "Apps Gateway",
        binaryMediaTypes: ["*/*"],
        endpointConfiguration: {
            types: "REGIONAL"
        }
    },
    routes: [
        {
            path: "/{key+}",
            method: "ANY",
            eventHandler: site
        },
        {
            path: "/",
            method: "ANY",
            eventHandler: site
        }
    ]
});

const siteAppBucket = new aws.s3.Bucket("site-app", {
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
const webContentsRootPath = path.join(path.join(__dirname, "code", "app", "build"));
crawlDirectory(webContentsRootPath, (filePath: string) => {
    const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");
    new aws.s3.BucketObject(
        relativeFilePath,
        {
            key: relativeFilePath,
            acl: "public-read",
            bucket: siteAppBucket,
            contentType: mime.getType(filePath) || undefined,
            source: new pulumi.asset.FileAsset(filePath)
        },
        {
            parent: siteAppBucket
        }
    );
});

const cdn = new aws.cloudfront.Distribution("site-app-cdn", {
    enabled: true,
    waitForDeployment: false,
    origins: [
        {
            originId: siteAppBucket.arn,
            domainName: siteAppBucket.websiteEndpoint,
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
        targetOriginId: siteAppBucket.arn,
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
