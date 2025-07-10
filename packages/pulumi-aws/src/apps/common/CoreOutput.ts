import { createAppModule, PulumiAppModule } from "@webiny/pulumi";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export type CoreOutput = PulumiAppModule<typeof CoreOutput>;

export const CoreOutput = createAppModule({
    name: "CoreOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = getStackOutput({
                folder: "apps/core",
                env: app.params.run.env,
                variant: app.params.run.variant
            });

            if (!output) {
                throw new Error("Core application is not deployed.");
            }

            return {
                fileManagerBucketId: output["fileManagerBucketId"],
                fileManagerBucketArn: output["fileManagerBucketArn"],
                primaryDynamodbTableArn: output["primaryDynamodbTableArn"],
                primaryDynamodbTableName: output["primaryDynamodbTableName"],
                primaryDynamodbTableHashKey: output["primaryDynamodbTableHashKey"],
                primaryDynamodbTableRangeKey: output["primaryDynamodbTableRangeKey"],
                logDynamodbTableArn: output["logDynamodbTableArn"],
                logDynamodbTableName: output["logDynamodbTableName"],
                logDynamodbTableHashKey: output["logDynamodbTableHashKey"],
                logDynamodbTableRangeKey: output["logDynamodbTableRangeKey"],
                cognitoUserPoolId: output["cognitoUserPoolId"],
                cognitoUserPoolArn: output["cognitoUserPoolArn"],
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"],
                cognitoAppClientId: output["cognitoAppClientId"],
                eventBusName: output["eventBusName"],
                eventBusArn: output["eventBusArn"],
                // These outputs are optional, since VPC is not always enabled.
                vpcPublicSubnetIds: output["vpcPublicSubnetIds"],
                vpcPrivateSubnetIds: output["vpcPrivateSubnetIds"],
                vpcSecurityGroupIds: output["vpcSecurityGroupIds"],
                // These outputs are optional, since Elasticsearch is not always enabled.
                elasticsearchDomainArn: output["elasticsearchDomainArn"],
                elasticsearchDomainEndpoint: output["elasticsearchDomainEndpoint"],
                elasticsearchDynamodbTableArn: output["elasticsearchDynamodbTableArn"],
                elasticsearchDynamodbTableName: output["elasticsearchDynamodbTableName"]
            };
        });
    }
});
