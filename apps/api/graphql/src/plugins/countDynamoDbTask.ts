import { createTaskDefinition } from "@webiny/tasks";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

export const createCountDynamoDbTask = () => {
    return createTaskDefinition({
        id: "countDdb",
        title: "Count DynamoDB",
        description: "Counts DynamoDB items.",
        run: async params => {
            const { response, isAborted, isCloseToTimeout } = params;
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({});
            }
            const documentClient = getDocumentClient();

            const results = await documentClient.scan({
                TableName: process.env.DB_TABLE
            });

            return response.done(`Count: ${results.Count}`);
        }
    });
};
