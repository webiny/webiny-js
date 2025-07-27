import type { IDeployment, IDeployments, IDeploymentsFetcher } from "./types.js";
import type {
    DynamoDBDocument,
    QueryCommandOutput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { QueryCommand, unmarshall } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { WebinyError } from "@webiny/error";
import { createDeployments } from "./Deployments.js";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { createDeployment } from "~/resolver/deployment/Deployment.js";
import { SemVer } from "semver";

const deploymentsValidation = zod.array(
    zod.object({
        name: zod.string(),
        env: zod.string(),
        variant: zod.string().optional(),
        region: zod.string(),
        version: zod.string(),
        s3Id: zod.string(),
        s3Arn: zod.string(),
        cognitoUserPoolId: zod
            .string()
            .optional()
            .transform(input => input || ""),
        primaryDynamoDbArn: zod.string(),
        primaryDynamoDbName: zod.string(),
        primaryDynamoDbHashKey: zod.string(),
        primaryDynamoDbRangeKey: zod.string(),
        elasticsearchDynamodbTableArn: zod.string().optional(),
        elasticsearchDynamodbTableName: zod.string().optional()
    })
);

export interface IDeploymentsFetcherParams {
    client: Pick<DynamoDBDocument, "send">;
    table: string;
}

export class DeploymentsFetcher implements IDeploymentsFetcher {
    private readonly client: Pick<DynamoDBDocument, "send">;
    private deployments: IDeployments | undefined;
    private readonly table: string;

    public constructor(params: IDeploymentsFetcherParams) {
        this.client = params.client;
        this.table = params.table;
    }

    public async fetch(): Promise<IDeployments> {
        if (!this.deployments) {
            this.deployments = createDeployments({
                deployments: await this.load()
            });
        }
        return this.deployments;
    }

    private async load(): Promise<IDeployment[]> {
        const cmd = new QueryCommand({
            TableName: this.table,
            IndexName: "GSI1",
            KeyConditionExpression: `GSI1_PK = :pk`,
            ExpressionAttributeValues: {
                ":pk": {
                    S: "DEPLOYMENTS"
                }
            }
        });

        let result: QueryCommandOutput;
        try {
            result = await this.client.send(cmd);
        } catch (ex) {
            console.error("Error while fetching all deployments to be synced.");
            throw ex;
        }
        return this.output(result);
    }

    private output(output: QueryCommandOutput): IDeployment[] {
        const items = (output.Items || []).map(item => {
            const result = unmarshall(item);
            return result.item;
        });
        if (items.length === 0) {
            throw new WebinyError({
                message: "No deployments found which need to be synced.",
                code: "NO_DEPLOYMENTS",
                data: {
                    table: this.table
                }
            });
        }

        const result = deploymentsValidation.safeParse(items);
        if (!result.success) {
            throw createZodError(result.error);
        }
        return result.data.map(item => {
            return createDeployment({
                name: item.name,
                env: item.env,
                variant: item.variant,
                region: item.region,
                version: new SemVer(item.version),
                services: {
                    s3Id: item.s3Id,
                    s3Arn: item.s3Arn,
                    cognitoUserPoolId: item.cognitoUserPoolId,
                    primaryDynamoDbArn: item.primaryDynamoDbArn,
                    primaryDynamoDbName: item.primaryDynamoDbName,
                    primaryDynamoDbHashKey: item.primaryDynamoDbHashKey,
                    primaryDynamoDbRangeKey: item.primaryDynamoDbRangeKey,
                    elasticsearchDynamodbTableArn: item.elasticsearchDynamodbTableArn,
                    elasticsearchDynamodbTableName: item.elasticsearchDynamodbTableName,
                    logDynamodbTableName: item.primaryDynamoDbName,
                    logDynamodbTableArn: item.primaryDynamoDbArn
                }
            });
        });
    }
}

export const createDeploymentsFetcher = (
    params: IDeploymentsFetcherParams
): IDeploymentsFetcher => {
    return new DeploymentsFetcher(params);
};
