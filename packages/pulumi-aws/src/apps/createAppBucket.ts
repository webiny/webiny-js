import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";
import { ApiOutput } from "~/apps/api";

export function createPublicAppBucket(app: PulumiApp, name: string) {
    const bucket = app.addResource(aws.s3.Bucket, {
        name: name,
        config: {
            acl: aws.s3.CannedAcl.PublicRead,
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "_NOT_FOUND_PAGE_/index.html"
            }
        }
    });

    const origin: aws.types.input.cloudfront.DistributionOrigin = {
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

// Forces S3 buckets to be available only through a cloudfront distribution.
// Requires `ApiOutput` module to be loaded.
export function createPrivateAppBucket(app: PulumiApp, name: string) {
    const api = app.getModule(ApiOutput);

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

    const origin: aws.types.input.cloudfront.DistributionOrigin = {
        originId: bucket.output.arn,
        domainName: bucket.output.bucket.apply(
            // We need to create a regional domain name. Otherwise, we'll run into the following issue:
            // https://aws.amazon.com/premiumsupport/knowledge-center/s3-http-307-response/
            name => `${name}.s3.${String(process.env.AWS_REGION)}.amazonaws.com`
        ),
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
                        },
                        {
                            Effect: "Allow",
                            Principal: { AWS: api.graphqlLambdaRole },
                            Action: [
                                "s3:GetObjectAcl",
                                "s3:DeleteObject",
                                "s3:PutObjectAcl",
                                "s3:PutObject",
                                "s3:GetObject",
                                "s3:ListBucket"
                            ],
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
