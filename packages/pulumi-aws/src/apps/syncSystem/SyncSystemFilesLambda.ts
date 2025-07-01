import path from "path";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { LAMBDA_RUNTIME } from "~/constants.js";
import { createSyncResourceName } from "./createSyncResourceName.js";
import { createAssetArchive } from "~/utils/createAssetArchive.js";
import { createLambdaRoleWithoutVpc } from "~/apps/lambdaUtils.js";

export type SyncSystemFilesLambda = PulumiAppModule<typeof SyncSystemFilesLambda>;

export const SyncSystemFilesLambda = createAppModule({
    name: "SyncSystemFilesLambda",
    config(app: PulumiApp) {
        const lambdaName = createSyncResourceName("files-lambda");
        const roleName = `${lambdaName}-role`;

        const role = createLambdaRoleWithoutVpc(app, {
            name: roleName
        });

        const policy = app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-policy-attachment`,
            config: {
                role: role.output.name,
                policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole
            }
        });

        const lambda = app.addResource(aws.lambda.Function, {
            name: lambdaName,
            config: {
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                role: role.output.arn,
                timeout: 900,
                memorySize: 512,
                code: createAssetArchive(path.join(app.paths.workspace, "files/build")),
                environment: {
                    variables: {
                        DEBUG: String(process.env.DEBUG),
                        PULUMI_APPS: "true",
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                }
            }
        });

        return {
            role,
            policy,
            lambda
        };
    }
});
