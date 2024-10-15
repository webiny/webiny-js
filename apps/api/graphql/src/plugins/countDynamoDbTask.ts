import { createTaskDefinition } from "@webiny/tasks";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

const COUNT_DDB_TASK_ID = "countDdb";

export const createCountDynamoDbTask = () => {
    return createTaskDefinition({
        id: COUNT_DDB_TASK_ID,
        title: "Count DynamoDB",
        description: "Counts DynamoDB items.",
        run: async params => {
            const { response, isAborted, isCloseToTimeout, context, store } = params;
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({});
            }
            const documentClient = getDocumentClient();

            const results = await documentClient.scan({
                TableName: process.env.DB_TABLE
            });

            const service = await context.tasks.fetchServiceInfo(store.getTask());
            // just to see what we get out
            console.log("service", service);

            return response.done(`Count: ${results.Count}`);
        }
    });
};
