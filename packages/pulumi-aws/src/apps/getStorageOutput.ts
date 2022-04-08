import { PulumiApp } from "@webiny/pulumi-sdk";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export function getStorageOutput(app: PulumiApp) {
    return app.addHandler(async () => {
        const output = await getStackOutput({
            folder: "apps/storage",
            env: app.ctx.env
        });

        return {
            fileManagerBucketId: output["fileManagerBucketId"] as string,
            primaryDynamodbTableArn: output["primaryDynamodbTableArn"] as string,
            primaryDynamodbTableName: output["primaryDynamodbTableName"] as string,
            cognitoUserPoolId: output["cognitoUserPoolId"] as string,
            cognitoUserPoolArn: output["cognitoUserPoolArn"] as string,
            cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"],
            cognitoAppClientId: output["cognitoAppClientId"] as string,
            eventBusArn: output["eventBusArn"] as string
        };
    });
}
