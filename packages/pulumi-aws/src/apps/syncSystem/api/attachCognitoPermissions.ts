import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import type { WithServiceManifest } from "~/utils/withServiceManifest.js";
import type { IGetSyncSystemOutputResult } from "~/apps/syncSystem/types.js";
import type { CoreOutput } from "~/apps/index.js";
import { createSyncResourceName } from "~/apps/syncSystem/createSyncResourceName.js";

export interface IAttachCognitoPermissionsParams {
    app: PulumiApp & WithServiceManifest;
    syncSystem: IGetSyncSystemOutputResult;
    core: CoreOutput;
}

export const attachCognitoPermissions = (params: IAttachCognitoPermissionsParams) => {
    const { app, syncSystem, core } = params;
    /**
     * TODO there must be a way to skip this if Cognito is not used in the Webiny deployment.
     */
    if (!core.cognitoUserPoolArn) {
        return null;
    }

    const { resolverLambdaRoleName, workerLambdaRoleName } = syncSystem;

    const resolverLambdaToS3ResourceName = createSyncResourceName(`resolver-lambda-to-cognito`);
    const workerLambdaToS3ResourceName = createSyncResourceName(`worker-lambda-to-cognito`);

    const cognitoPolicy = app.addResource(aws.iam.Policy, {
        name: `${resolverLambdaToS3ResourceName}-policy`,
        config: {
            description:
                "This policy enables access from Sync System Resolver and Worker Lambda to Webiny Cognito.",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForSyncLambdaToCognito",
                        Effect: "Allow",
                        Action: ["cognito-idp:*"],
                        Resource: core.cognitoUserPoolArn.apply(arn => {
                            return [arn, `${arn}/*`];
                        })
                    }
                ]
            }
        }
    });

    const resolverLambdaS3PolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${resolverLambdaToS3ResourceName}-policy-attachment`,
        config: {
            role: resolverLambdaRoleName,
            policyArn: cognitoPolicy.output.arn
        }
    });

    const workerLambdaS3PolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${workerLambdaToS3ResourceName}-policy-attachment`,
        config: {
            role: workerLambdaRoleName,
            policyArn: cognitoPolicy.output.arn
        }
    });

    return {
        cognitoPolicy,
        workerLambdaS3PolicyAttachment,
        resolverLambdaS3PolicyAttachment
    };
};
