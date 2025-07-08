import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import type { IDeployment } from "~/resolver/deployment/types.js";
import { Deployment } from "~/resolver/deployment/Deployment.js";
import { SemVer } from "semver";
import { version } from "@webiny/cli/package.json";

const currentVersion = new SemVer(version);

export interface ICreateDeploymentParams {
    client: DynamoDBDocument;
    tableName: string;
    item: ICreateMockDeploymentItem;
}

export const storeDeployment = async (params: ICreateDeploymentParams) => {
    const { client, item, tableName } = params;

    await client.send(
        new PutCommand({
            TableName: tableName,
            Item: {
                PK: `DEPLOYMENT#${item.env}#${item.variant || "unknown"}`,
                SK: `default`,
                GSI1_PK: "DEPLOYMENTS",
                GSI1_SK: `${item.env}#${item.variant || "unknown"}`,
                item: {
                    ...item,
                    version: item.version ? item.version.format() : undefined
                }
            }
        })
    );
};

export interface ICreateMockDeploymentItem {
    name: string;
    env: string;
    variant?: string;
    region: string;
    version: SemVer;
    s3Id: string;
    s3Arn: string;
    cognitoUserPoolId: string;
    primaryDynamoDbArn: string;
    primaryDynamoDbName: string;
    primaryDynamoDbHashKey: string;
    primaryDynamoDbRangeKey: string;
    elasticsearchDynamodbTableArn?: string;
    elasticsearchDynamodbTableName?: string;
    logDynamodbTableArn: string;
    logDynamodbTableName: string;
}

export const createMockDeploymentData = (item: Partial<ICreateMockDeploymentItem> = {}) => {
    return {
        name: "test",
        env: "test",
        variant: "test",
        region: "us-east-1",
        version: currentVersion,
        s3Id: "s3Id",
        s3Arn: "s3Arn",
        primaryDynamoDbArn: "primaryDynamoDbArn",
        primaryDynamoDbName: "primaryDynamoDbName",
        primaryDynamoDbHashKey: "primaryDynamoDbHashKey",
        primaryDynamoDbRangeKey: "primaryDynamoDbRangeKey",
        elasticsearchDynamodbTableArn: "elasticsearchDynamodbTableArn",
        elasticsearchDynamodbTableName: "elasticsearchDynamodbTableName",
        logDynamodbTableArn: "logDynamodbTableArn",
        logDynamodbTableName: "logDynamodbTableName",
        cognitoUserPoolId: "cognitoUserPoolId",
        ...item
    };
};

export const createMockDeployment = (
    input: Partial<ICreateMockDeploymentItem> = {}
): IDeployment => {
    const item = createMockDeploymentData(input);

    return new Deployment({
        ...item,
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
            logDynamodbTableArn: item.logDynamodbTableArn,
            logDynamodbTableName: item.logDynamodbTableName
        }
    });
};

export const createMockSourceDeployment = (params: Partial<ICreateMockDeploymentItem> = {}) => {
    return createMockDeployment({
        env: "dev",
        variant: "source",
        name: "dev#source",
        s3Id: "sourceS3Id",
        ...params
    });
};

export const createMockTargetDeployment = (params: Partial<ICreateMockDeploymentItem> = {}) => {
    return createMockDeployment({
        env: "dev",
        variant: "target",
        name: "dev#target",
        s3Id: "targetS3Id",
        ...params
    });
};
