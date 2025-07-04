import path from "path";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { LAMBDA_RUNTIME } from "~/constants.js";
import { createSyncResourceName } from "./createSyncResourceName.js";
import { createAssetArchive } from "~/utils/createAssetArchive.js";
import { createLambdaRoleWithoutVpc } from "~/apps/lambdaUtils.js";

export type SyncSystemWorkerLambda = PulumiAppModule<typeof SyncSystemWorkerLambda>;

export const SyncSystemWorkerLambda = createAppModule({
    name: "SyncSystemWorkerLambda",
    config(app: PulumiApp) {
        const lambdaName = createSyncResourceName("worker-lambda");
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
                code: createAssetArchive(path.join(app.paths.workspace, "worker/build")),
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
