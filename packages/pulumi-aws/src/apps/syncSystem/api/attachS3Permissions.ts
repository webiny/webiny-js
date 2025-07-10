import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import type { IGetSyncSystemOutputResult } from "~/apps/syncSystem/types.js";
import type { CoreOutput } from "~/apps/common/CoreOutput.js";
import { createSyncResourceName } from "~/apps/syncSystem/createSyncResourceName.js";
import type { WithServiceManifest } from "~/utils/withServiceManifest.js";

export interface IAttachS3PermissionsParams {
    app: PulumiApp & WithServiceManifest;
    syncSystem: IGetSyncSystemOutputResult;
    core: CoreOutput;
}

export const attachS3Permissions = (params: IAttachS3PermissionsParams) => {
    const { app, syncSystem, core } = params;

    const { resolverLambdaRoleName, workerLambdaRoleName } = syncSystem;

    const resolverLambdaToS3ResourceName = createSyncResourceName(`resolver-lambda-to-s3-fm`);
    const workerLambdaToS3ResourceName = createSyncResourceName(`worker-lambda-to-s3-fm`);

    const s3Policy = app.addResource(aws.iam.Policy, {
        name: `${resolverLambdaToS3ResourceName}-policy`,
        config: {
            description:
                "This policy enables access from Sync System Resolver and Worker Lambda to Webiny S3.",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForSyncLambdaToS3",
                        Effect: "Allow",
                        Action: [
                            "s3:DeleteObject",
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            core.fileManagerBucketArn.apply(arn => arn),
                            core.fileManagerBucketArn.apply(arn => `${arn}/*`)
                        ]
                    }
                ]
            }
        }
    });

    const resolverLambdaS3PolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${resolverLambdaToS3ResourceName}-policy-attachment`,
        config: {
            role: resolverLambdaRoleName,
            policyArn: s3Policy.output.arn
        }
    });

    const workerLambdaS3PolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${workerLambdaToS3ResourceName}-policy-attachment`,
        config: {
            role: workerLambdaRoleName,
            policyArn: s3Policy.output.arn
        }
    });

    return {
        s3Policy,
        workerLambdaS3PolicyAttachment,
        resolverLambdaS3PolicyAttachment
    };
};
