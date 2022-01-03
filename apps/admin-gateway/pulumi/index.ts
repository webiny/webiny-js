import { join } from "path";
import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const bucket = new aws.s3.Bucket("admin-gateway", {
        acl: "public-read",
        forceDestroy: true,
        website: {
            indexDocument: "index.html",
            errorDocument: "index.html"
        }
    });

    const role = new aws.iam.Role(
        `lambda-edge-role`,
        {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
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
        },
        { parent: this }
    );

    // Some resources _must_ be put in us-east-1, such as Lambda at Edge.
    const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

    const originRequest = new aws.lambda.Function(
        "origin-request",
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.handler",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.FileAsset(join(__dirname, "origin-request.js"))
            })
        },
        { provider: awsUsEast1, parent: this }
    );

    const originResponse = new aws.lambda.Function(
        "origin-response",
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.handler",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.FileAsset(join(__dirname, "origin-response.js"))
            })
        },
        { provider: awsUsEast1, parent: this }
    );

    const cloudfront = new aws.cloudfront.Distribution("admin-gateway-cdn", {
        enabled: true,
        waitForDeployment: false,
        origins: [
            {
                originId: bucket.arn,
                domainName: bucket.websiteEndpoint,
                customOriginConfig: {
                    originProtocolPolicy: "http-only",
                    httpPort: 80,
                    httpsPort: 443,
                    originSslProtocols: ["TLSv1.2"]
                }
            }
        ],
        defaultCacheBehavior: {
            compress: true,
            targetOriginId: bucket.arn,
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                cookies: {
                    forward: "whitelist",
                    whitelistedNames: ["webiny-stage"]
                },
                queryString: false
            },
            // MinTTL <= DefaultTTL <= MaxTTL
            minTtl: 0,
            defaultTtl: 600,
            maxTtl: 600,
            lambdaFunctionAssociations: [
                {
                    eventType: "origin-request",
                    lambdaArn: originRequest.qualifiedArn
                },
                {
                    eventType: "origin-response",
                    lambdaArn: originResponse.qualifiedArn
                }
            ]
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

    return {
        appStorage: bucket.id,
        appUrl: cloudfront.domainName.apply(value => `https://${value}`)
    };
};
