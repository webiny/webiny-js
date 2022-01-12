import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

class Policies {
    private readonly awsRegion: string;
    private readonly callerIdentityOutput: pulumi.Output<aws.GetCallerIdentityResult>;

    constructor() {
        const current = aws.getCallerIdentity({});
        this.callerIdentityOutput = pulumi.output(current);
        this.awsRegion = aws.config.requireRegion();
    }

    getPreRenderingServiceLambdaPolicy(
        primaryDynamodbTableArn: string,
        bucketId: string
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
                            pulumi.interpolate`${primaryDynamodbTableArn}`,
                            pulumi.interpolate`${primaryDynamodbTableArn}/*`
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
                            pulumi.interpolate`arn:aws:s3:::${bucketId}/*`,
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

    getPbExportPagesLambdaPolicy(
        primaryDynamodbTableArn: string,
        bucketId: string
    ): aws.iam.Policy {
        return new aws.iam.Policy("PbExportPageTaskLambdaPolicy", {
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
                            pulumi.interpolate`${primaryDynamodbTableArn}`,
                            pulumi.interpolate`${primaryDynamodbTableArn}/*`
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
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${bucketId}/*`,
                            // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                            pulumi.interpolate`arn:aws:s3:::${bucketId}`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: pulumi.interpolate`arn:aws:lambda:${this.awsRegion}:${this.callerIdentityOutput.accountId}:function:*`
                    }
                ]
            }
        });
    }

    getImportPagesLambdaPolicy(params: {
        primaryDynamodbTableArn: string;
        bucketId: string;
        cognitoUserPoolArn: string;
    }): aws.iam.Policy {
        return new aws.iam.Policy("ImportPageLambdaPolicy", {
            description: "This policy enables access Dynamodb, S3, Lambda and Cognito IDP",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
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
                            pulumi.interpolate`${params.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`
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
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${params.bucketId}/*`,
                            // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                            pulumi.interpolate`arn:aws:s3:::${params.bucketId}`
                        ]
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
                        Resource: pulumi.interpolate`${params.cognitoUserPoolArn}`
                    }
                ]
            }
        });
    }

    getPbUpdateSettingsLambdaPolicy(primaryDynamodbTableArn: string): aws.iam.Policy {
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
                            pulumi.interpolate`${primaryDynamodbTableArn}`,
                            pulumi.interpolate`${primaryDynamodbTableArn}/*`
                        ]
                    }
                ]
            }
        });
    }

    getApiGraphqlLambdaPolicy(params: {
        primaryDynamodbTableArn: string;
        bucketId: string;
        cognitoUserPoolArn: string;
    }): aws.iam.Policy {
        return new aws.iam.Policy("ApiGraphqlLambdaPolicy", {
            description: "This policy enables access to Dynamodb, S3, Lambda and Cognito IDP",
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
                            pulumi.interpolate`${params.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`
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
                        Resource: pulumi.interpolate`arn:aws:s3:::${params.bucketId}/*`
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
                        Resource: pulumi.interpolate`${params.cognitoUserPoolArn}`
                    }
                ]
            }
        });
    }

    getHeadlessCmsLambdaPolicy(params: { primaryDynamodbTableArn: string }): aws.iam.Policy {
        return new aws.iam.Policy("HeadlessCmsLambdaPolicy", {
            description: "This policy enables access to Dynamodb streams",
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
                            pulumi.interpolate`${params.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`
                        ]
                    }
                ]
            }
        });
    }
}

const policies = new Policies();
export default policies;
