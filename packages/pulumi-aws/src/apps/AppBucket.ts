import * as aws from "@pulumi/aws";
import { PulumiInputValue } from "../types";
import { defineAppModule } from "@webiny/pulumi-sdk";

type OriginConfig = PulumiInputValue<
    PulumiInputValue<aws.cloudfront.DistributionArgs["origins"]>[number]
>;

export const AppBucket = defineAppModule({
    name: "Admin bucket",
    run(app) {
        const bucket = app.addResource(aws.s3.Bucket, {
            name: "app-bucket",
            config: {
                acl: aws.s3.CannedAcl.Private,
                forceDestroy: true
            }
        });

        // Origin Identity is a kind of AWS user that represents Cloudfront distribution
        // We can add IAM policies to it later, to allow accessing private S3 bucket
        const originIdentity = app.addResource(aws.cloudfront.OriginAccessIdentity, {
            name: `app-bucket-origin-identity`,
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
            name: `app-bucket-bucket-block-access`,
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
            name: `app-bucket-bucket-policy`,
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
});
