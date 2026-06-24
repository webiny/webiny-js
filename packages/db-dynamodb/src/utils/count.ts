import type { QueryAllParams } from "~/utils/query.js";
import { DocQueryCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";

export const count = async (params: QueryAllParams): Promise<number> => {
    const { client, partitionKey, options = {} } = params;

    const result = await client.getDocumentClient().send(
        new DocQueryCommand({
            TableName: client.getTableName(),
            KeyConditionExpression: "#pk = :pk",
            ExpressionAttributeNames: { "#pk": "PK" },
            ExpressionAttributeValues: { ":pk": partitionKey },
            Select: "COUNT",
            IndexName: options.index
        })
    );

    return result.Count || 0;
};
