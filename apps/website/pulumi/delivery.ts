import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

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

        const role = new aws.iam.Role("tenant-router-role", {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        });

        new aws.iam.RolePolicyAttachment(`tenant-router-role-policy-attachment`, {
            role,
            policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole
        });

        // Some resources _must_ be put in us-east-1, such as Lambda at Edge.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const tenantRouter = new aws.lambda.Function(
            "tenant-router",
            {
                publish: true,
                runtime: "nodejs14.x",
                handler: "index.handler",
                role: role.arn,
                timeout: 5,
                memorySize: 128,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./tenantRouter")
                })
            },
            { provider: awsUsEast1 }
        );

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
                lambdaFunctionAssociations: [
                    {
                        eventType: "origin-request",
                        includeBody: false,
                        lambdaArn: pulumi.interpolate`${tenantRouter.qualifiedArn}`
                    },
                    {
                        eventType: "viewer-request",
                        includeBody: false,
                        lambdaArn: pulumi.interpolate`${tenantRouter.qualifiedArn}`
                    }
                ],
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: true
                },
                // MinTTL <= DefaultTTL <= MaxTTL
                minTtl: 0,
                defaultTtl: 30,
                maxTtl: 30
            },
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
