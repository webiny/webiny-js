import { Table } from "dynamodb-toolbox";
import chunk from "lodash/chunk";

export const insertDynamoDbTestData = async (
    table: Table<string, string, string>,
    data: Record<string, any>[]
) => {
    const documentClient = table.DocumentClient;

    if (!documentClient) {
        throw Error(`DocumentClient is not set on the "${table.name}" table.`);
    }

    const chunkedItems: any[][] = chunk(data, 25);
    for (const items of chunkedItems) {
        const params = {
            RequestItems: {
                [table.name]: items.map(item => {
                    return {
                        PutRequest: {
                            Item: item
                        }
                    };
                })
            }
        };

        await documentClient.batchWrite(params).promise();
    }
};
