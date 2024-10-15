import { createAppModule, PulumiAppModule } from "@webiny/pulumi";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export type ApiOutput = PulumiAppModule<typeof ApiOutput>;

export const ApiOutput = createAppModule({
    name: "ApiOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = getStackOutput({
                folder: "apps/api",
                env: app.params.run.env
            });

            if (!output) {
                throw new Error("API application is not deployed.");
            }

            return {
                apiDomain: output["apiDomain"] as string,
                apiUrl: output["apiUrl"] as string,
                graphqlLambdaRole: output["graphqlLambdaRole"] as string,
                apwSchedulerEventRule: output["apwSchedulerEventRule"] as string | undefined,
                apwSchedulerEventTargetId: output["apwSchedulerEventTargetId"] as
                    | string
                    | undefined,
                apwSchedulerExecuteAction: output["apwSchedulerExecuteAction"] as
                    | string
                    | undefined,
                apwSchedulerScheduleAction: output["apwSchedulerScheduleAction"] as
                    | string
                    | undefined,
                cognitoAppClientId: output["cognitoAppClientId"] as string,
                cognitoUserPoolId: output["cognitoUserPoolId"] as string,
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"] as string,
                dynamoDbTable: output["dynamoDbTable"] as string,
                region: output["region"] as string,
                websocketApiUrl: output["websocketApiUrl"] as string
            };
        });
    }
});
