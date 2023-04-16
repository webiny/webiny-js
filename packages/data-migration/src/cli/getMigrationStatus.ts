import LambdaClient from "aws-sdk/clients/lambda";
import { MigrationEventHandlerResponse } from "~/types";

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
    const response = await lambdaClient
        .invoke({
            FunctionName: functionName,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ ...payload, command: "status" })
        })
        .promise();

    return JSON.parse(response.Payload as string) as MigrationEventHandlerResponse;
};
