import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { QueryCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { unmarshall } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IServiceManifestLoader } from "@webiny/api-core/features/serviceDiscovery/index.js";

export class DdbServiceManifestLoader implements IServiceManifestLoader {
    private readonly client: Pick<DynamoDBDocument, "send">;

    constructor(client: Pick<DynamoDBDocument, "send">) {
        this.client = client;
    }

    async load() {
        const result = await this.client.send(
            new QueryCommand({
                TableName: String(process.env.DB_TABLE),
                IndexName: "GSI1",
                KeyConditionExpression: "GSI1_PK = :GSI1_PK AND GSI1_SK > :GSI1_SK",
                ExpressionAttributeValues: {
                    ":GSI1_PK": { S: "SERVICE_MANIFESTS" },
                    ":GSI1_SK": { S: " " }
                }
            })
        );

        const items = result.Items;

        if (!Array.isArray(items)) {
            return undefined;
        }

        return items.map(item => unmarshall(item).data);
    }
}
