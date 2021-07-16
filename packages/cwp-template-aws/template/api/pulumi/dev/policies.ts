import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export type EsDomain = aws.elasticsearch.Domain | pulumi.Output<aws.elasticsearch.GetDomainResult>;

class Policies {
    private readonly awsRegion: string;
    private readonly callerIdentityOutput: pulumi.Output<aws.GetCallerIdentityResult>;

    constructor() {
        const current = aws.getCallerIdentity({});
        this.callerIdentityOutput = pulumi.output(current);
        this.awsRegion = aws.config.requireRegion();
    }

    getDynamoDbToElasticLambdaPolicy(domain: EsDomain): aws.iam.Policy {
        return new aws.iam.Policy("DynamoDbToElasticLambdaPolicy-updated", {
            description: "This policy enables access to ES and Dynamodb streams",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForES",
                        Effect: "Allow",
                        Action: [
                            "es:ESHttpDelete",
                            "es:ESHttpPatch",
                            "es:ESHttpPost",
                            "es:ESHttpPut"
                        ],
                        Resource: [
                            pulumi.interpolate`${domain.arn}`,
                            pulumi.interpolate`${domain.arn}/*`
                        ]
                    }
                ]
            }
        });
    }

    getFileManagerLambdaPolicy(bucket: aws.s3.Bucket): aws.iam.Policy {
        return new aws.iam.Policy("FileManagerLambdaPolicy", {
            description: "This policy enables access to Lambda and S3",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: "lambda:InvokeFunction",
                        Resource: "*"
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: "s3:*",
                        Resource: pulumi.interpolate`arn:aws:s3:::${bucket.id}/*`
                    }
                ]
            }
        });
    }

    getPreRenderingServiceLambdaPolicy(
        primaryDynamodbTable: aws.dynamodb.Table,
        elasticsearchDynamodbTable: aws.dynamodb.Table,
        bucket: aws.s3.Bucket
    ): aws.iam.Policy {
        return new aws.iam.Policy("PreRenderingServicePolicy", {
            description: "This policy enables access to Lambda, S3, Cloudfront and Dynamodb",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${primaryDynamodbTable.arn}`,
                            pulumi.interpolate`${primaryDynamodbTable.arn}/*`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: "lambda:InvokeFunction",
                        Resource: pulumi.interpolate`arn:aws:lambda:${this.awsRegion}:${this.callerIdentityOutput.accountId}:function:*`
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: [
                            "s3:DeleteObject",
                            "s3:GetObject",
                            "s3:GetObjectAcl",
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${bucket.id}/*`,
                            /**
                             * We're using the hard-coded value for "delivery" S3 bucket because;
                             * It is created during deployment of the `apps/website` stack which is after the api stack,
                             * so, we don't know its ARN.
                             */
                            "arn:aws:s3:::delivery-*/*"
                        ]
                    },
                    {
                        Sid: "PermissionForCloudfront",
                        Effect: "Allow",
                        Action: "cloudfront:CreateInvalidation",
                        Resource: pulumi.interpolate`arn:aws:cloudfront::${this.callerIdentityOutput.accountId}:distribution/*`
                    }
                ]
            }
        });
    }

    getPbUpdateSettingsLambdaPolicy(primaryDynamodbTable: aws.dynamodb.Table): aws.iam.Policy {
        return new aws.iam.Policy("PbUpdateSettingsLambdaPolicy", {
            description: "This policy enables access to Dynamodb",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "AllowDynamoDBAccess",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:PutItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${primaryDynamodbTable.arn}`,
                            pulumi.interpolate`${primaryDynamodbTable.arn}/*`
                        ]
                    }
                ]
            }
        });
    }

    getApiGraphqlLambdaPolicy({
        primaryDynamodbTable,
        elasticsearchDynamodbTable,
        bucket,
        elasticsearchDomain,
        cognitoUserPool
    }: {
        primaryDynamodbTable: aws.dynamodb.Table;
        elasticsearchDynamodbTable: aws.dynamodb.Table;
        bucket: aws.s3.Bucket;
        elasticsearchDomain: EsDomain;
        cognitoUserPool: aws.cognito.UserPool;
    }): aws.iam.Policy {
        return new aws.iam.Policy("ApiGraphqlLambdaPolicy", {
            description: "This policy enables access to ES, Dynamodb, S3, Lambda and Cognito IDP",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:ConditionCheckItem",
                            "dynamodb:CreateBackup",
                            "dynamodb:CreateTable",
                            "dynamodb:CreateTableReplica",
                            "dynamodb:DeleteBackup",
                            "dynamodb:DeleteItem",
                            "dynamodb:DeleteTable",
                            "dynamodb:DeleteTableReplica",
                            "dynamodb:DescribeBackup",
                            "dynamodb:DescribeContinuousBackups",
                            "dynamodb:DescribeContributorInsights",
                            "dynamodb:DescribeExport",
                            "dynamodb:DescribeKinesisStreamingDestination",
                            "dynamodb:DescribeLimits",
                            "dynamodb:DescribeReservedCapacity",
                            "dynamodb:DescribeReservedCapacityOfferings",
                            "dynamodb:DescribeStream",
                            "dynamodb:DescribeTable",
                            "dynamodb:DescribeTableReplicaAutoScaling",
                            "dynamodb:DescribeTimeToLive",
                            "dynamodb:DisableKinesisStreamingDestination",
                            "dynamodb:EnableKinesisStreamingDestination",
                            "dynamodb:ExportTableToPointInTime",
                            "dynamodb:GetItem",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:ListBackups",
                            "dynamodb:ListContributorInsights",
                            "dynamodb:ListExports",
                            "dynamodb:ListStreams",
                            "dynamodb:ListTables",
                            "dynamodb:ListTagsOfResource",
                            "dynamodb:PartiQLDelete",
                            "dynamodb:PartiQLInsert",
                            "dynamodb:PartiQLSelect",
                            "dynamodb:PartiQLUpdate",
                            "dynamodb:PurchaseReservedCapacityOfferings",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:RestoreTableFromBackup",
                            "dynamodb:RestoreTableToPointInTime",
                            "dynamodb:Scan",
                            "dynamodb:UpdateContinuousBackups",
                            "dynamodb:UpdateContributorInsights",
                            "dynamodb:UpdateItem",
                            "dynamodb:UpdateTable",
                            "dynamodb:UpdateTableReplicaAutoScaling",
                            "dynamodb:UpdateTimeToLive"
                        ],
                        Resource: [
                            pulumi.interpolate`${primaryDynamodbTable.arn}`,
                            pulumi.interpolate`${primaryDynamodbTable.arn}/*`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: [
                            "s3:GetObjectAcl",
                            "s3:DeleteObject",
                            "s3:PutObjectAcl",
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        Resource: pulumi.interpolate`arn:aws:s3:::${bucket.id}/*`
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: pulumi.interpolate`arn:aws:lambda:${this.awsRegion}:${this.callerIdentityOutput.accountId}:function:*`
                    },
                    {
                        Sid: "PermissionForCognitoIdp",
                        Effect: "Allow",
                        Action: "cognito-idp:*",
                        Resource: pulumi.interpolate`${cognitoUserPool.arn}`
                    },
                    {
                        Sid: "PermissionForES",
                        Effect: "Allow",
                        Action: "es:*",
                        Resource: [
                            pulumi.interpolate`${elasticsearchDomain.arn}`,
                            pulumi.interpolate`${elasticsearchDomain.arn}/*`
                        ]
                    }
                ]
            }
        });
    }

    getHeadlessCmsLambdaPolicy({
        primaryDynamodbTable,
        elasticsearchDynamodbTable,
        elasticsearchDomain
    }: {
        primaryDynamodbTable: aws.dynamodb.Table;
        elasticsearchDynamodbTable: aws.dynamodb.Table;
        elasticsearchDomain: EsDomain;
    }): aws.iam.Policy {
        return new aws.iam.Policy("HeadlessCmsLambdaPolicy", {
            description: "This policy enables access to ES and Dynamodb streams",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:ConditionCheckItem",
                            "dynamodb:CreateBackup",
                            "dynamodb:CreateTable",
                            "dynamodb:CreateTableReplica",
                            "dynamodb:DeleteBackup",
                            "dynamodb:DeleteItem",
                            "dynamodb:DeleteTable",
                            "dynamodb:DeleteTableReplica",
                            "dynamodb:DescribeBackup",
                            "dynamodb:DescribeContinuousBackups",
                            "dynamodb:DescribeContributorInsights",
                            "dynamodb:DescribeExport",
                            "dynamodb:DescribeKinesisStreamingDestination",
                            "dynamodb:DescribeLimits",
                            "dynamodb:DescribeReservedCapacity",
                            "dynamodb:DescribeReservedCapacityOfferings",
                            "dynamodb:DescribeStream",
                            "dynamodb:DescribeTable",
                            "dynamodb:DescribeTableReplicaAutoScaling",
                            "dynamodb:DescribeTimeToLive",
                            "dynamodb:DisableKinesisStreamingDestination",
                            "dynamodb:EnableKinesisStreamingDestination",
                            "dynamodb:ExportTableToPointInTime",
                            "dynamodb:GetItem",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:ListBackups",
                            "dynamodb:ListContributorInsights",
                            "dynamodb:ListExports",
                            "dynamodb:ListStreams",
                            "dynamodb:ListTables",
                            "dynamodb:ListTagsOfResource",
                            "dynamodb:PartiQLDelete",
                            "dynamodb:PartiQLInsert",
                            "dynamodb:PartiQLSelect",
                            "dynamodb:PartiQLUpdate",
                            "dynamodb:PurchaseReservedCapacityOfferings",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:RestoreTableFromBackup",
                            "dynamodb:RestoreTableToPointInTime",
                            "dynamodb:Scan",
                            "dynamodb:UpdateContinuousBackups",
                            "dynamodb:UpdateContributorInsights",
                            "dynamodb:UpdateItem",
                            "dynamodb:UpdateTable",
                            "dynamodb:UpdateTableReplicaAutoScaling",
                            "dynamodb:UpdateTimeToLive"
                        ],
                        Resource: [
                            pulumi.interpolate`${primaryDynamodbTable.arn}`,
                            pulumi.interpolate`${primaryDynamodbTable.arn}/*`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}`,
                            pulumi.interpolate`${elasticsearchDynamodbTable.arn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForES",
                        Effect: "Allow",
                        Action: "es:*",
                        Resource: [
                            pulumi.interpolate`${elasticsearchDomain.arn}`,
                            pulumi.interpolate`${elasticsearchDomain.arn}/*`
                        ]
                    }
                ]
            }
        });
    }
}

const policies = new Policies();
export default policies;
