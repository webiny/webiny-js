import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createAppModule } from "@webiny/pulumi";

export const ComplianceCloudtrail = createAppModule({
    name: "ComplianceCloudtrail",
    config({ addResource }) {
        const bucket = addResource(aws.s3.Bucket, {
            name: "cloudtrail-logs",
            config: { forceDestroy: true }
        });

        const callerIdentity = aws.getCallerIdentity({});

        const bucketPolicy = addResource(aws.s3.BucketPolicy, {
            name: "cloudtrail-logs-policy",
            config: {
                bucket: bucket.output.id,
                policy: pulumi
                    .all([bucket.output.arn, callerIdentity])
                    .apply(([bucketArn, callerIdentity]) =>
                        JSON.stringify({
                            Version: "2012-10-17",
                            Statement: [
                                {
                                    Sid: "AWSCloudTrailAclCheck",
                                    Effect: "Allow",
                                    Principal: {
                                        Service: "cloudtrail.amazonaws.com"
                                    },
                                    Action: "s3:GetBucketAcl",
                                    Resource: bucketArn
                                },
                                {
                                    Sid: "AWSCloudTrailWrite",
                                    Effect: "Allow",
                                    Principal: {
                                        Service: "cloudtrail.amazonaws.com"
                                    },
                                    Action: "s3:PutObject",
                                    Resource: `${bucketArn}/AWSLogs/${callerIdentity.accountId}/*`,
                                    Condition: {
                                        StringEquals: {
                                            "s3:x-amz-acl": "bucket-owner-full-control"
                                        }
                                    }
                                }
                            ]
                        })
                    )
            }
        });

        // Block any public access
        const bucketPublicAccessBlock = addResource(aws.s3.BucketPublicAccessBlock, {
            name: "cloudtrail-logs-block-public-access",
            config: {
                bucket: bucket.output.id,
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true
            }
        });

        // Logging the following:
        // - read-only, write-only, or all management events
        // - all Insights events
        // - all or a subset of data events
        const trail = addResource(aws.cloudtrail.Trail, {
            name: "trail",
            config: {
                s3BucketName: bucket.output.id,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
                eventSelectors: [
                    {
                        readWriteType: "All",
                        includeManagementEvents: true,
                        dataResources: [
                            {
                                type: "AWS::Lambda::Function",
                                values: ["arn:aws:lambda"]
                            },
                            {
                                type: "AWS::S3::Object",
                                values: ["arn:aws:s3"]
                            },
                            {
                                type: "AWS::DynamoDB::Table",
                                values: ["arn:aws:dynamodb"]
                            }
                        ]
                    }
                ],
                insightSelectors: [
                    { insightType: "ApiCallRateInsight" },
                    { insightType: "ApiErrorRateInsight" }
                ]
            }
        });

        return {
            bucket,
            bucketPolicy,
            bucketPublicAccessBlock,
            trail
        };
    }
});
