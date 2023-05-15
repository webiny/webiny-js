import LambdaClient from "aws-sdk/clients/lambda";
import { MigrationEventHandlerResponse } from "~/types";
import { executeWithRetry } from "@webiny/utils";

interface GetMigrationStatusParams {
    lambdaClient: LambdaClient;
    functionName: string;
    payload?: Record<string, any>;
}

export const getMigrationStatus = async ({
    payload,
    functionName,
    lambdaClient
}: GetMigrationStatusParams) => {
    const getStatus = () => {
        return lambdaClient
            .invoke({
                FunctionName: functionName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({ ...payload, command: "status" })
            })
            .promise();
    };

    const response = await executeWithRetry(getStatus);

    return JSON.parse(response.Payload as string) as MigrationEventHandlerResponse;
};
