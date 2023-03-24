import LambdaClient from "aws-sdk/clients/lambda";
import { MigrationEventHandlerResponse } from "~/types";

interface RunMigrationParams {
    lambdaClient: LambdaClient;
    functionName: string;
    payload?: Record<string, any>;
}

/**
 * Run the migration Lambda, and re-run when resuming is requested.
 */
export const runMigration = async ({
    payload,
    functionName,
    lambdaClient
}: RunMigrationParams): Promise<MigrationEventHandlerResponse> => {
    const invokeMigration = async () => {
        const response = await lambdaClient
            .invoke({
                FunctionName: functionName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify(payload)
            })
            .promise();

        return JSON.parse(response.Payload as string) as MigrationEventHandlerResponse;
    };

    let response: MigrationEventHandlerResponse;
    while (true) {
        response = await invokeMigration();
        // If we received an error, it must be an unrecoverable error, and we don't retry.
        if (response.error) {
            return response;
        }

        // This means we need to resume the migration, so we continue with the loop.
        if (response.data?.resume) {
            continue;
        }

        break;
    }

    return response;
};
