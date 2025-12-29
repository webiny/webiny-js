import type { PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { getStackOutput } from "@webiny/project";
import { type IDefaultStackOutput } from "~/pulumi/types.js";

export type ApiOutput = PulumiAppModule<typeof ApiOutput>;

export const ApiOutput = createAppModule({
    name: "ApiOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = await getStackOutput<IDefaultStackOutput>({
                app: "api"
            });

            if (!output) {
                throw new Error("API application is not deployed.");
            }

            return {
                apiDomain: output["apiDomain"],
                apiUrl: output["apiUrl"],
                graphqlLambdaRole: output["graphqlLambdaRole"],
                graphqlLambdaRoleName: output["graphqlLambdaRoleName"],
                cognitoAppClientId: output["cognitoAppClientId"],
                cognitoUserPoolId: output["cognitoUserPoolId"],
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"],
                dynamoDbTable: output["dynamoDbTable"],
                region: output["region"],
                websocketApiId: output["websocketApiId"],
                websocketApiUrl: output["websocketApiUrl"],
                migrationLambdaArn: output["migrationLambdaArn"],
                graphqlLambdaName: output["graphqlLambdaName"],
                backgroundTaskLambdaArn: output["backgroundTaskLambdaArn"],
                backgroundTaskStepFunctionArn: output["backgroundTaskStepFunctionArn"],
                fileManagerManageLambdaArn: output["fileManagerManageLambdaArn"],
                fileManagerManageLambdaRole: output["fileManagerManageLambdaRole"],
                fileManagerManageLambdaRoleName: output["fileManagerManageLambdaRoleName"],
                fileManagerDownloadLambdaArn: output["fileManagerDownloadLambdaArn"]
            };
        });
    }
});
