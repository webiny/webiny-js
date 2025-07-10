import { Plugin } from "@webiny/plugins";
import {
    createAfterDeployPlugin,
    createAfterDestroyPlugin
} from "@webiny/cli-plugin-deploy-pulumi/plugins/index.js";
import { DeleteCommand, getDocumentClient, PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import { getSyncSystemOutput } from "@webiny/pulumi-aws/apps/syncSystem/getSyncSystemOutput.js";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils/index.js";
import { createSystemName } from "@webiny/api-sync-system/utils/createSystemName.js";
import type { ISyncSystemDeploymentInfo } from "./types.js";

interface IGetStacksParams {
    env: string;
    variant: string | undefined;
}

const getStacks = async (params: IGetStacksParams) => {
    const { env, variant } = params;
    const syncSystem = getSyncSystemOutput({
        env
    });
    if (!syncSystem) {
        return {
            syncSystem: null
        };
    }
    const core = getStackOutput({
        env,
        variant,
        folder: "apps/core"
    });
    if (!core) {
        return {
            syncSystem,
            core: null
        };
    }
    return {
        syncSystem,
        core
    };
};
/**
 * Note that the plugins will only have effect if the Sync System is deployed in same env as the API system.
 */
export const createSyncSystemPlugins = (): Plugin[] => {
    return [
        /**
         * After deployment of API system, we need to write the deployment information to the Sync System DynamoDB table.
         * This way Sync System will know which deployments exist.
         */
        createAfterDeployPlugin(async ({ env, variant }) => {
            const { syncSystem, core } = await getStacks({ env, variant });
            if (!syncSystem || !core) {
                return;
            }
            const client = getDocumentClient({
                region: syncSystem.region
            });
            const tableName = syncSystem.dynamoDbName;
            if (!tableName) {
                throw new Error("Sync System DynamoDB table name is not defined.");
            }

            const item: ISyncSystemDeploymentInfo = {
                name: createSystemName({ env, variant }),
                env,
                variant,
                version: process.env.WEBINY_VERSION as string,
                region: core.region,
                s3Id: core.fileManagerBucketId,
                s3Arn: core.fileManagerBucketArn,
                primaryDynamoDbArn: core.primaryDynamodbTableArn,
                primaryDynamoDbName: core.primaryDynamodbTableName,
                primaryDynamoDbHashKey: core.primaryDynamodbTableHashKey,
                primaryDynamoDbRangeKey: core.primaryDynamodbTableRangeKey,
                elasticsearchDynamodbTableArn: core.elasticsearchDynamodbTableArn,
                elasticsearchDynamodbTableName: core.elasticsearchDynamodbTableName,
                logDynamodbTableArn: core.logDynamodbTableArn,
                logDynamodbTableName: core.logDynamodbTableName,
                cognitoUserPoolId: core.cognitoUserPoolId
            };

            const cmd = new PutCommand({
                TableName: tableName,
                Item: {
                    PK: `DEPLOYMENT#${env}#${variant || "unknown"}`,
                    SK: `default`,
                    GSI1_PK: "DEPLOYMENTS",
                    GSI1_SK: `${env}#${variant || "unknown"}`,
                    item
                }
            });
            try {
                await client.send(cmd);
            } catch (ex) {
                console.error("Error while writing to Sync System DynamoDB table.");
                console.log(ex.message);
                throw ex;
            }
        }),
        /**
         * After destroy of the deployment, we need to delete the deployment information from the Sync System DynamoDB table.
         */
        createAfterDestroyPlugin(async ({ env, variant }) => {
            const { syncSystem, core } = await getStacks({ env, variant });
            if (!syncSystem || !core) {
                return;
            }
            const client = getDocumentClient({
                region: syncSystem.region
            });
            const tableName = syncSystem.dynamoDbName;
            if (!tableName) {
                throw new Error("Sync System DynamoDB table name is not defined.");
            }

            const cmd = new DeleteCommand({
                TableName: tableName,
                Key: {
                    PK: `DEPLOYMENT#${env}#${variant || "unknown"}`,
                    SK: `default`
                }
            });
            try {
                await client.send(cmd);
            } catch (ex) {
                console.error("Error while deleting from Sync System DynamoDB table.");
                console.log(ex.message);
                throw ex;
            }
        })
    ];
};
