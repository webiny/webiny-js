/**
 * This list contains all the action permission need for a "create-webiny-project".
 * It is NOT a strict implementation of the least privilege security principle i.e.
 * there might be some permissions in this list that are not needed at all which we can remove with help of access analyzer.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customPolicyForProgrammaticAccess = {
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
            ]
        },
        {
            Sid: "PermissionForApiGateway",
            Effect: "Allow",
            Action: ["apigateway:*"]
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
            ]
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
            ]
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
            ]
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
            ]
        },
        {
            Sid: "PermissionForIAM",
            Effect: "Allow",
            Action: [
                "iam:AttachRolePolicy",
                "iam:CreatePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:GetPolicy",
                "iam:GetPolicyVersion",
                "iam:GetRole",
                "iam:GetUser",
                "iam:ListAttachedRolePolicies",
                "iam:ListInstanceProfilesForRole",
                "iam:ListRolePolicies",
                "iam:ListRoles",
                "iam:PassRole",
                "iam:PutRolePolicy",
                "iam:TagRole",
                "iam:UntagRole"
            ]
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
            ]
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
            ]
        },
        {
            Sid: "PermissionForApiS3",
            Effect: "Allow",
            Action: ["s3:*"]
        },
        {
            Sid: "PermissionForApiSts",
            Effect: "Allow",
            Action: ["sts:GetCallerIdentity"]
        },
        {
            Sid: "PermissionForApiTag",
            Effect: "Allow",
            Action: ["tag:TagResources", "tag:UntagResources"]
        }
    ]
};

/**
 * Partial list of permission action for S3
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
