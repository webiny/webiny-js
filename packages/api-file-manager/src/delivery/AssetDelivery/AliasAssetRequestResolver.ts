import { Request } from "@webiny/handler/types";
import { DynamoDBClient, QueryCommand, unmarshall } from "@webiny/aws-sdk/client-dynamodb";
import { AssetRequest, AssetRequestResolver } from "~/delivery";

export class AliasAssetRequestResolver implements AssetRequestResolver {
    private documentClient: DynamoDBClient;
    private resolver: AssetRequestResolver;

    constructor(documentClient: DynamoDBClient, resolver: AssetRequestResolver) {
        this.documentClient = documentClient;
        this.resolver = resolver;
    }

    async resolve(request: Request): Promise<AssetRequest | undefined> {
        const resolvedAsset = await this.resolver.resolve(request);

        if (resolvedAsset) {
            return resolvedAsset;
        }

        const params = (request.params as Record<string, any>) ?? {};
        const query = (request.query as Record<string, any>) ?? {};
        const path = decodeURI(params["*"]);

        const tenant = query.tenant || "root";
        const fileKey = await this.getFileByAlias(tenant, path);

        if (!fileKey) {
            return undefined;
        }

        const { original, ...options } = query;

        return new AssetRequest({
            key: fileKey,
            context: {
                url: request.url
            },
            options: {
                original: original !== undefined,
                ...options
            }
        });
    }

    private async getFileByAlias(tenant: string, alias: string): Promise<string | null> {
        const { Items } = await this.documentClient.send(
            new QueryCommand({
                TableName: String(process.env.DB_TABLE),
                IndexName: "GSI1",
                Limit: 1,
                KeyConditionExpression: "GSI1_PK = :GSI1_PK AND GSI1_SK = :GSI1_SK",
                ExpressionAttributeValues: {
                    ":GSI1_PK": { S: `T#${tenant}#FM#FILE_ALIASES` },
                    ":GSI1_SK": { S: alias }
                }
            })
        );

        if (!Array.isArray(Items)) {
            return null;
        }
        const [item] = Items;
        if (!item) {
            return null;
        }
        const { data } = unmarshall(item);

        return data?.key ?? null;
    }
}
