 

/**
 * This list contains all the action permission need for a "create-webiny-project".
 * It is NOT a strict implementation of the least privilege security principle i.e.
 * there might be some permissions in this list that are not needed at all which we can remove with help of access analyzer.
 */
const policyForProgrammaticAccess = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PermissionForCloudfront",
            Effect: "Allow",
            Action: [
                "cloudfront:CreateDistribution",
                "cloudfront:CreateDistributionWithTags",
                "cloudfront:DeleteDistribution",
                "cloudfront:GetDistribution",
                "cloudfront:ListTagsForResource",
                "cloudfront:TagResource",
                "cloudfront:UntagResource",
                "cloudfront:UpdateDistribution"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForApiGateway",
            Effect: "Allow",
            Action: ["apigateway:*"],
            Resource: "*"
        },
        {
            Sid: "PermissionForCognitoIdp",
            Effect: "Allow",
            Action: [
                "cognito-idp:CreateUserPool",
                "cognito-idp:CreateUserPoolClient",
                "cognito-idp:DeleteUserPool",
                "cognito-idp:DeleteUserPoolClient",
                "cognito-idp:DescribeUserPool",
                "cognito-idp:DescribeUserPoolClient",
                "cognito-idp:GetUserPoolMfaConfig",
                "cognito-idp:TagResource",
                "cognito-idp:UntagResource"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForDynamodb",
            Effect: "Allow",
            Action: [
                "dynamodb:CreateTable",
                "dynamodb:DeleteTable",
                "dynamodb:DescribeContinuousBackups",
                "dynamodb:DescribeTable",
                "dynamodb:DescribeTimeToLive",
                "dynamodb:ListTagsOfResource",
                "dynamodb:TagResource",
                "dynamodb:UntagResource"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForElasticsearch",
            Effect: "Allow",
            Action: [
                "es:AddTags",
                "es:CreateElasticsearchDomain",
                "es:DeleteElasticsearchDomain",
                "es:DescribeElasticsearchDomain",
                "es:GetCompatibleElasticsearchVersions",
                "es:ListTags",
                "es:RemoveTags",
                "es:UpdateElasticsearchDomainConfig"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForEventBridge",
            Effect: "Allow",
            Action: [
                "events:DeleteRule",
                "events:DescribeRule",
                "events:ListTagsForResource",
                "events:ListTargetsByRule",
                "events:PutRule",
                "events:PutTargets",
                "events:RemoveTargets",
                "events:TagResource",
                "events:UntagResource"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForIAM",
            Effect: "Allow",
            Action: [
                "iam:AttachRolePolicy",
                "iam:CreatePolicy",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:DeletePolicy",
                "iam:DeletePolicyVersion",
                "iam:GetPolicy",
                "iam:GetPolicyVersion",
                "iam:GetRole",
                "iam:GetUser",
                "iam:ListAttachedRolePolicies",
                "iam:ListInstanceProfilesForRole",
                "iam:ListRolePolicies",
                "iam:ListPolicyVersions",
                "iam:ListRoles",
                "iam:PassRole",
                "iam:PutRolePolicy",
                "iam:TagRole",
                "iam:UntagRole"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForApiKms",
            Effect: "Allow",
            Action: [
                "kms:CreateGrant",
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:Encrypt",
                "kms:GenerateDataKey",
                "kms:GenerateDataKeyPair",
                "kms:GenerateDataKeyPairWithoutPlaintext",
                "kms:GenerateDataKeyWithoutPlaintext",
                "kms:ListAliases",
                "kms:ListKeys",
                "kms:ReEncryptFrom",
                "kms:ReEncryptTo",
                "kms:TagResource",
                "kms:UntagResource"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForLambda",
            Effect: "Allow",
            Action: [
                "lambda:AddPermission",
                "lambda:CreateEventSourceMapping",
                "lambda:CreateFunction",
                "lambda:DeleteEventSourceMapping",
                "lambda:DeleteFunction",
                "lambda:GetAccountSettings",
                "lambda:GetAlias",
                "lambda:GetEventSourceMapping",
                "lambda:GetFunction",
                "lambda:GetFunctionCodeSigningConfig",
                "lambda:GetFunctionConfiguration",
                "lambda:GetLayerVersion",
                "lambda:GetLayerVersionPolicy",
                "lambda:GetPolicy",
                "lambda:InvokeAsync",
                "lambda:InvokeFunction",
                "lambda:ListAliases",
                "lambda:ListEventSourceMappings",
                "lambda:ListFunctions",
                "lambda:ListTags",
                "lambda:ListVersionsByFunction",
                "lambda:RemovePermission",
                "lambda:TagResource",
                "lambda:UntagResource",
                "lambda:UpdateEventSourceMapping",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForApiS3",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "*"
        },
        {
            Sid: "PermissionForApiSts",
            Effect: "Allow",
            Action: ["sts:GetCallerIdentity"],
            Resource: "*"
        },
        {
            Sid: "PermissionForApiTag",
            Effect: "Allow",
            Action: ["tag:TagResources", "tag:UntagResources"],
            Resource: "*"
        },
        {
            Sid: "PermissionForEC2",
            Effect: "Allow",
            Action: ["ec2:*"],
            Resource: "*"
        },
        {
            Sid: "PermissionForLogs",
            Effect: "Allow",
            Action: [
                "logs:CancelExportTask",
                "logs:CreateLogDelivery",
                "logs:DeleteDestination",
                "logs:DeleteLogDelivery",
                "logs:DeleteQueryDefinition",
                "logs:DeleteResourcePolicy",
                "logs:DescribeDestinations",
                "logs:DescribeExportTasks",
                "logs:DescribeQueries",
                "logs:DescribeQueryDefinitions",
                "logs:DescribeResourcePolicies",
                "logs:GetLogDelivery",
                "logs:GetLogRecord",
                "logs:GetQueryResults",
                "logs:ListLogDeliveries",
                "logs:PutDestination",
                "logs:PutDestinationPolicy",
                "logs:PutQueryDefinition",
                "logs:PutResourcePolicy",
                "logs:StopQuery",
                "logs:TestMetricFilter",
                "logs:UpdateLogDelivery"
            ],
            Resource: "*"
        },
        {
            Sid: "PermissionForPassRole",
            Effect: "Allow",
            Action: ["iam:PassRole"],
            Resource: [
                "arn:aws:iam::*:role/fm-lambda-role-*",
                "arn:aws:iam::*:role/pre-rendering-service-lambda-role*",
                "arn:aws:iam::*:role/dynamo-to-elastic-lambda-role-*",
                "arn:aws:iam::*:role/headless-cms-lambda-role-*",
                "arn:aws:iam::*:role/pb-update-settings-lambda-role-*",
                "arn:aws:iam::*:role/api-lambda-role-*"
            ]
        }
    ]
};

/**
 * Partial list of permission action for S3
 */
const S3 = [
    "s3:CreateBucket",
    "s3:DeleteBucket",
    "s3:GetAccelerateConfiguration",
    "s3:GetBucketAcl",
    "s3:GetBucketCors",
    "s3:GetBucketEncryption",
    "s3:GetBucketLifecycle",
    "s3:GetBucketLocation",
    "s3:GetBucketLogging",
    "s3:GetBucketNotification",
    "s3:GetBucketObjectLockConfiguration",
    "s3:GetBucketReplication",
    "s3:GetBucketRequestPayment",
    "s3:GetBucketTagging",
    "s3:GetBucketVersioning",
    "s3:GetBucketWebsite",
    "s3:ListBuckets",
    "s3:PutBucketCors",
    "s3:PutBucketNotification",
    "s3:PutBucketTagging",
    "s3:PutBucketWebsite"
];

const preRenderingServicePolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
            Effect: "Allow",
            Action: ["dynamodb:Scan", "dynamodb:Query"],
            Resource: "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/index/*"
        },
        {
            Sid: "VisualEditor1",
            Effect: "Allow",
            Action: [
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem"
            ],
            Resource: "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*"
        },
        {
            Sid: "VisualEditor2",
            Effect: "Allow",
            Action: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
            Resource: "*"
        },
        {
            Sid: "VisualEditor3",
            Effect: "Allow",
            Action: [
                "s3:PutObject",
                "s3:GetObjectAcl",
                "s3:GetObject",
                "lambda:InvokeFunction",
                "dynamodb:Scan",
                "dynamodb:Query",
                "s3:DeleteObject",
                "cloudfront:CreateInvalidation",
                "s3:PutObjectAcl"
            ],
            Resource: [
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*",
                "arn:aws:lambda:ap-southeast-1:291748552399:function:*",
                "arn:aws:cloudfront::291748552399:distribution/*",
                "arn:aws:s3:::*/*"
            ]
        }
    ]
};

const pbUpdateSettingsLambdaPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
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
            Resource: "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*"
        },
        {
            Sid: "PermissionForCloudWatchLogs",
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: "*"
        }
    ]
};

const headlessCmsLambdaPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
            Effect: "Allow",
            Action: [
                "dynamodb:DeleteItem",
                "dynamodb:DescribeContributorInsights",
                "dynamodb:RestoreTableToPointInTime",
                "dynamodb:ListTagsOfResource",
                "dynamodb:CreateTableReplica",
                "dynamodb:UpdateContributorInsights",
                "dynamodb:CreateBackup",
                "dynamodb:DeleteTable",
                "dynamodb:UpdateTableReplicaAutoScaling",
                "dynamodb:UpdateContinuousBackups",
                "dynamodb:PartiQLSelect",
                "dynamodb:DescribeTable",
                "dynamodb:PartiQLInsert",
                "dynamodb:GetItem",
                "dynamodb:DescribeContinuousBackups",
                "dynamodb:DescribeKinesisStreamingDestination",
                "dynamodb:EnableKinesisStreamingDestination",
                "dynamodb:BatchGetItem",
                "dynamodb:DisableKinesisStreamingDestination",
                "dynamodb:UpdateTimeToLive",
                "dynamodb:BatchWriteItem",
                "dynamodb:ConditionCheckItem",
                "dynamodb:PutItem",
                "dynamodb:PartiQLUpdate",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteTableReplica",
                "dynamodb:DescribeTimeToLive",
                "dynamodb:CreateTable",
                "dynamodb:RestoreTableFromBackup",
                "dynamodb:ExportTableToPointInTime",
                "dynamodb:UpdateTable",
                "dynamodb:PartiQLDelete",
                "dynamodb:DescribeTableReplicaAutoScaling"
            ],
            Resource: [
                "arn:aws:cognito-idp:ap-southeast-1:291748552399:userpool/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*"
            ]
        },
        {
            Sid: "VisualEditor1",
            Effect: "Allow",
            Action: [
                "dynamodb:PartiQLSelect",
                "dynamodb:GetShardIterator",
                "dynamodb:RestoreTableFromBackup",
                "dynamodb:DescribeContributorInsights",
                "dynamodb:Scan",
                "dynamodb:UpdateContributorInsights",
                "dynamodb:Query",
                "dynamodb:DescribeStream",
                "dynamodb:DescribeExport",
                "dynamodb:DescribeBackup",
                "dynamodb:DeleteBackup",
                "dynamodb:GetRecords"
            ],
            Resource: [
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/export/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/index/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/stream/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/backup/*"
            ]
        },
        {
            Sid: "VisualEditor2",
            Effect: "Allow",
            Action: [
                "es:DeletePackage",
                "es:ListDomainsForPackage",
                "es:DeleteElasticsearchServiceRole",
                "es:AcceptInboundCrossClusterSearchConnection",
                "es:DeleteInboundCrossClusterSearchConnection",
                "es:DeleteOutboundCrossClusterSearchConnection",
                "es:CreateElasticsearchServiceRole",
                "es:RejectInboundCrossClusterSearchConnection",
                "es:PurchaseReservedElasticsearchInstanceOffering",
                "dynamodb:DescribeReservedCapacity",
                "es:DescribePackages",
                "es:ListElasticsearchInstanceTypes",
                "es:DescribeElasticsearchInstanceTypeLimits",
                "es:ListElasticsearchInstanceTypeDetails",
                "dynamodb:ListTables",
                "dynamodb:PurchaseReservedCapacityOfferings",
                "dynamodb:DescribeReservedCapacityOfferings",
                "es:DescribeOutboundCrossClusterSearchConnections",
                "dynamodb:DescribeLimits",
                "dynamodb:ListExports",
                "es:DescribeReservedElasticsearchInstanceOfferings",
                "es:UpdatePackage",
                "dynamodb:ListBackups",
                "es:GetPackageVersionHistory",
                "dynamodb:ListStreams",
                "es:DescribeInboundCrossClusterSearchConnections",
                "es:DescribeReservedElasticsearchInstances",
                "dynamodb:ListContributorInsights",
                "es:ListDomainNames",
                "es:CreatePackage",
                "es:ListElasticsearchVersions"
            ],
            Resource: "*"
        },
        {
            Sid: "VisualEditor3",
            Effect: "Allow",
            Action: "es:*",
            Resource: "arn:aws:es:ap-southeast-1:291748552399:domain/*"
        },
        {
            Sid: "PermissionForCloudWatchLogs",
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: "*"
        }
    ]
};

const fileManagerLambdaPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
            Effect: "Allow",
            Action: [
                "s3:ListStorageLensConfigurations",
                "s3:ListAccessPointsForObjectLambda",
                "s3:GetAccessPoint",
                "s3:PutAccountPublicAccessBlock",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "lambda:InvokeFunction",
                "s3:ListAccessPoints",
                "s3:ListJobs",
                "s3:PutStorageLensConfiguration",
                "s3:CreateJob"
            ],
            Resource: "*"
        },
        {
            Sid: "VisualEditor1",
            Effect: "Allow",
            Action: "s3:*",
            Resource: "arn:aws:s3:::*/*"
        },
        {
            Sid: "VisualEditor2",
            Effect: "Allow",
            Action: "s3:*",
            Resource: [
                "arn:aws:s3:ap-southeast-1:291748552399:job/*",
                "arn:aws:s3:::*",
                "arn:aws:s3:ap-southeast-1:291748552399:accesspoint/*",
                "arn:aws:s3:ap-southeast-1:291748552399:storage-lens/*",
                "arn:aws:s3-object-lambda:ap-southeast-1:291748552399:accesspoint/*"
            ]
        },
        {
            Sid: "PermissionForCloudWatchLogs",
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: "*"
        }
    ]
};

const dynamoDbToElasticLambdaPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
            Effect: "Allow",
            Action: "dynamodb:ListStreams",
            Resource: "*"
        },
        {
            Sid: "VisualEditor1",
            Effect: "Allow",
            Action: [
                "es:ESHttpPost",
                "dynamodb:GetShardIterator",
                "es:ESHttpPatch",
                "dynamodb:DescribeStream",
                "es:ESHttpDelete",
                "es:ESHttpPut",
                "dynamodb:GetRecords"
            ],
            Resource: [
                "arn:aws:es:ap-southeast-1:291748552399:domain/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/stream/*"
            ]
        },
        {
            Sid: "PermissionForCloudWatchLogs",
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: "*"
        }
    ]
};

const apiGraphqlLambdaPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "VisualEditor0",
            Effect: "Allow",
            Action: [
                "cognito-idp:ForgotPassword",
                "es:DeletePackage",
                "cognito-idp:ConfirmSignUp",
                "es:ListDomainsForPackage",
                "es:DeleteElasticsearchServiceRole",
                "es:AcceptInboundCrossClusterSearchConnection",
                "logs:CreateLogStream",
                "es:DeleteInboundCrossClusterSearchConnection",
                "cognito-idp:SetUserMFAPreference",
                "es:DeleteOutboundCrossClusterSearchConnection",
                "cognito-idp:SignUp",
                "cognito-idp:VerifyUserAttribute",
                "es:CreateElasticsearchServiceRole",
                "es:RejectInboundCrossClusterSearchConnection",
                "cognito-idp:ListDevices",
                "cognito-idp:ListUserPools",
                "es:PurchaseReservedElasticsearchInstanceOffering",
                "logs:CreateLogGroup",
                "cognito-idp:AssociateSoftwareToken",
                "cognito-idp:RespondToAuthChallenge",
                "cognito-idp:DeleteUserAttributes",
                "cognito-idp:UpdateUserAttributes",
                "dynamodb:DescribeReservedCapacity",
                "es:DescribePackages",
                "es:ListElasticsearchInstanceTypes",
                "es:DescribeElasticsearchInstanceTypeLimits",
                "cognito-idp:GlobalSignOut",
                "es:ListElasticsearchInstanceTypeDetails",
                "dynamodb:ListTables",
                "cognito-idp:CreateUserPool",
                "dynamodb:PurchaseReservedCapacityOfferings",
                "cognito-idp:ForgetDevice",
                "dynamodb:DescribeReservedCapacityOfferings",
                "cognito-idp:GetUserAttributeVerificationCode",
                "cognito-idp:InitiateAuth",
                "cognito-idp:DeleteUser",
                "es:DescribeOutboundCrossClusterSearchConnections",
                "dynamodb:DescribeLimits",
                "dynamodb:ListExports",
                "es:DescribeReservedElasticsearchInstanceOfferings",
                "cognito-idp:GetUser",
                "cognito-idp:ConfirmForgotPassword",
                "cognito-idp:SetUserSettings",
                "es:UpdatePackage",
                "dynamodb:ListBackups",
                "es:GetPackageVersionHistory",
                "logs:PutLogEvents",
                "dynamodb:ListStreams",
                "cognito-idp:VerifySoftwareToken",
                "cognito-idp:GetDevice",
                "es:DescribeInboundCrossClusterSearchConnections",
                "es:DescribeReservedElasticsearchInstances",
                "dynamodb:ListContributorInsights",
                "es:ListDomainNames",
                "cognito-idp:DescribeUserPoolDomain",
                "es:CreatePackage",
                "cognito-idp:UpdateDeviceStatus",
                "cognito-idp:ChangePassword",
                "cognito-idp:ConfirmDevice",
                "cognito-idp:ResendConfirmationCode",
                "es:ListElasticsearchVersions"
            ],
            Resource: "*"
        },
        {
            Sid: "VisualEditor1",
            Effect: "Allow",
            Action: [
                "dynamodb:PartiQLSelect",
                "dynamodb:GetShardIterator",
                "dynamodb:RestoreTableFromBackup",
                "dynamodb:DescribeContributorInsights",
                "dynamodb:Scan",
                "dynamodb:UpdateContributorInsights",
                "dynamodb:Query",
                "dynamodb:DescribeStream",
                "dynamodb:DescribeExport",
                "dynamodb:DescribeBackup",
                "dynamodb:DeleteBackup",
                "dynamodb:GetRecords"
            ],
            Resource: [
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/export/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/index/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/stream/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*/backup/*"
            ]
        },
        {
            Sid: "VisualEditor2",
            Effect: "Allow",
            Action: [
                "dynamodb:DeleteItem",
                "dynamodb:DescribeContributorInsights",
                "dynamodb:RestoreTableToPointInTime",
                "dynamodb:ListTagsOfResource",
                "dynamodb:CreateTableReplica",
                "dynamodb:UpdateContributorInsights",
                "dynamodb:CreateBackup",
                "dynamodb:DeleteTable",
                "dynamodb:UpdateTableReplicaAutoScaling",
                "dynamodb:UpdateContinuousBackups",
                "s3:GetObjectAcl",
                "dynamodb:PartiQLSelect",
                "dynamodb:DescribeTable",
                "dynamodb:PartiQLInsert",
                "dynamodb:GetItem",
                "dynamodb:DescribeContinuousBackups",
                "dynamodb:DescribeKinesisStreamingDestination",
                "s3:DeleteObject",
                "dynamodb:EnableKinesisStreamingDestination",
                "s3:PutObjectAcl",
                "dynamodb:BatchGetItem",
                "dynamodb:DisableKinesisStreamingDestination",
                "dynamodb:UpdateTimeToLive",
                "dynamodb:BatchWriteItem",
                "dynamodb:ConditionCheckItem",
                "dynamodb:PutItem",
                "lambda:InvokeFunction",
                "dynamodb:PartiQLUpdate",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteTableReplica",
                "dynamodb:DescribeTimeToLive",
                "dynamodb:CreateTable",
                "s3:PutObject",
                "s3:GetObject",
                "dynamodb:RestoreTableFromBackup",
                "dynamodb:ExportTableToPointInTime",
                "dynamodb:UpdateTable",
                "dynamodb:PartiQLDelete",
                "dynamodb:DescribeTableReplicaAutoScaling"
            ],
            Resource: [
                "arn:aws:lambda:ap-southeast-1:291748552399:function:*",
                "arn:aws:s3:::*/*",
                "arn:aws:dynamodb:ap-southeast-1:291748552399:table/*"
            ]
        },
        {
            Sid: "VisualEditor3",
            Effect: "Allow",
            Action: "cognito-idp:*",
            Resource: "arn:aws:cognito-idp:ap-southeast-1:291748552399:userpool/*"
        },
        {
            Sid: "VisualEditor4",
            Effect: "Allow",
            Action: "es:*",
            Resource: "arn:aws:es:ap-southeast-1:291748552399:domain/*"
        }
    ]
};
