import * as aws from "@pulumi/aws";
import { PulumiInputValue } from "../types";
import { PulumiApp } from "@webiny/pulumi-app";

type OriginConfig = PulumiInputValue<
    PulumiInputValue<aws.cloudfront.DistributionArgs["origins"]>[number]
>;

export function createPublicAppBucket(app: PulumiApp, name: string) {
    const bucket = app.addResource(aws.s3.Bucket, {
        name: name,
        config: {
            acl: aws.s3.CannedAcl.PublicRead,
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "index.html"
            }
        }
    });

    const origin: OriginConfig = {
        originId: bucket.output.arn,
        domainName: bucket.output.websiteEndpoint,
        customOriginConfig: {
            originProtocolPolicy: "http-only",
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ["TLSv1.2"]
        }
    };

    return {
        bucket,
        origin
    };
}

// TODO Currently not used, because of issues with uploading prerendered pages.
// Allows to have private S3 buckets available only through cloudfront distribution.
export function createPrivateAppBucket(app: PulumiApp, name: string) {
    const bucket = app.addResource(aws.s3.Bucket, {
        name: name,
        config: {
            acl: aws.s3.CannedAcl.Private,
            forceDestroy: true
        }
    });

    // Origin Identity is a kind of AWS user that represents Cloudfront distribution
    // We can add IAM policies to it later, to allow accessing private S3 bucket
    const originIdentity = app.addResource(aws.cloudfront.OriginAccessIdentity, {
        name: `${name}-origin-identity`,
        config: {}
    });

    const origin: OriginConfig = {
        originId: bucket.output.arn,
        domainName: bucket.output.bucketDomainName,
        s3OriginConfig: {
            originAccessIdentity: originIdentity.output.cloudfrontAccessIdentityPath
        }
    };

    // block any public access
    const bucketPublicAccessBlock = app.addResource(aws.s3.BucketPublicAccessBlock, {
        name: `${name}-bucket-block-access`,
        config: {
            bucket: bucket.output.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }
    });

    // Create an IAM policy to allow access to S3 bucket from cloudfront
    const bucketPolicy = app.addResource(aws.s3.BucketPolicy, {
        name: `${name}-bucket-policy`,
        config: {
            bucket: bucket.output.bucket,
            policy: {
                Version: "2012-10-17",
                Statement: bucket.output.arn.apply(arn => {
                    const statements: aws.iam.PolicyStatement[] = [
                        {
                            Effect: "Allow",
                            Principal: { AWS: originIdentity.output.iamArn },
                            // we need GetObject to retrieve objects from S3
                            // and ListBucket allows to properly handle non-existing files (404)
                            Action: ["s3:ListBucket", "s3:GetObject"],
                            Resource: [`${arn}`, `${arn}/*`]
                        }
                    ];

                    return statements;
                })
            }
        }
    });

    return {
        bucket,
        originIdentity,
        origin,
        bucketPublicAccessBlock,
        bucketPolicy
    };
}
