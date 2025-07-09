import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi/types";
import type { IGetSyncSystemOutputResult } from "../types";
import { createSyncResourceName } from "../createSyncResourceName";
import { ApiGraphql } from "~/apps/api/ApiGraphql.js";
import { ApiFileManager } from "~/apps/api/ApiFileManager.js";
import type { WithServiceManifest } from "~/utils/withServiceManifest.js";

export interface IAttachEventBusPermissionsParam {
    app: PulumiApp & WithServiceManifest;
    syncSystem: IGetSyncSystemOutputResult;
}

/**
 * We need to attach the policy to:
 * * GraphQL Lambda Role
 * * File Manager Manage Lambda Role
 * TODO determine if any other are required
 */
export const attachEventBusPermissions = (params: IAttachEventBusPermissionsParam) => {
    const { app, syncSystem } = params;

    const { eventBusArn } = syncSystem;

    const graphql = app.getModule(ApiGraphql);
    const fileManager = app.getModule(ApiFileManager);

    const lambdaToEventBridgeResourceName = createSyncResourceName(`lambda-to-event-bridge`);
    const eventBridgePolicy = app.addResource(aws.iam.Policy, {
        name: `${lambdaToEventBridgeResourceName}-policy`,
        config: {
            description:
                "This policy enables access from Webiny Lambdas to Sync System EventBridge.",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForSyncLambdaToEventBridge",
                        Effect: "Allow",
                        Action: "events:PutEvents",
                        Resource: [eventBusArn]
                    }
                ]
            }
        }
    });

    const graphQlPolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${lambdaToEventBridgeResourceName}-graphql-role-policy-attachment`,
        config: {
            role: graphql.role.output.name,
            policyArn: eventBridgePolicy.output.arn
        }
    });
    const fileManagerManagePolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${lambdaToEventBridgeResourceName}-fm-role-policy-attachment`,
        config: {
            role: fileManager.roles.manage.output.name,
            policyArn: eventBridgePolicy.output.arn
        }
    });

    return {
        eventBridgePolicy,
        graphQlPolicyAttachment,
        fileManagerManagePolicyAttachment
    };
};
