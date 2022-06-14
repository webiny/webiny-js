import { createAppModule, PulumiAppModule } from "@webiny/pulumi-app";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export type StorageOutput = PulumiAppModule<typeof StorageOutput>;

export const StorageOutput = createAppModule({
    name: "StorageOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = getStackOutput({
                folder: "apps/storage",
                env: app.run.params.env
            });

            if (!output) {
                throw new Error("Storage application is not deployed.");
            }

            return {
                fileManagerBucketId: output["fileManagerBucketId"] as string,
                primaryDynamodbTableArn: output["primaryDynamodbTableArn"] as string,
                primaryDynamodbTableName: output["primaryDynamodbTableName"] as string,
                primaryDynamodbTableHashKey: output["primaryDynamodbTableHashKey"] as string,
                primaryDynamodbTableRangeKey: output["primaryDynamodbTableRangeKey"] as string,
                cognitoUserPoolId: output["cognitoUserPoolId"] as string,
                cognitoUserPoolArn: output["cognitoUserPoolArn"] as string,
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"] as string,
                cognitoAppClientId: output["cognitoAppClientId"] as string,
                eventBusArn: output["eventBusArn"] as string,
                // These outputs are optional, since VPC is not always enabled.
                vpcPublicSubnetIds: output["vpcPublicSubnetIds"] as string[] | undefined,
                vpcPrivateSubnetIds: output["vpcPrivateSubnetIds"] as string[] | undefined,
                vpcSecurityGroupIds: output["vpcSecurityGroupIds"] as string[] | undefined,

                elasticsearchDomainArn: output["elasticsearchDomainArn"] as string | undefined,
                elasticsearchDomainEndpoint: output["elasticsearchDomainEndpoint"] as
                    | string
                    | undefined,
                elasticsearchDynamodbTableArn: output["elasticsearchDynamodbTableArn"] as
                    | string
                    | undefined,
                elasticsearchDynamodbTableName: output["elasticsearchDynamodbTableName"] as
                    | string
                    | undefined
            };
        });
    }
});
