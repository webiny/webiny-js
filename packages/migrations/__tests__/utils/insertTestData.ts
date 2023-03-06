import { Table } from "dynamodb-toolbox";

export const insertTestData = async (table: Table, data: Record<string, any>[]) => {
    const documentClient = table.DocumentClient;

    if (!documentClient) {
        throw Error(`DocumentClient is not set on the "${table.name}" table.`);
    }

    for (const item of data) {
        await documentClient.put({ TableName: table.name, Item: item }).promise();
    }
};
