import { describe, expect, it } from "vitest";
import { DynamoDBTableType } from "~/types.js";
import { createDeployment } from "~/resolver/deployment/Deployment.js";
import SemVer from "semver/classes/semver.js";

describe("Deployment", () => {
    it("should get table information", () => {
        const deployment = createDeployment({
            name: "test#blue",
            env: "test",
            variant: "blue",
            services: {
                s3Id: "s3-id",
                s3Arn: "arn:aws:s3:::s3-bucket",
                primaryDynamoDbName: "primary-table",
                primaryDynamoDbArn: "arn:aws:dynamodb:region:account-id:table/primary-table",
                opensearchDynamodbTableName: "opensearch-table",
                opensearchDynamodbTableArn:
                    "arn:aws:dynamodb:region:account-id:table/opensearch-table",
                primaryDynamoDbHashKey: "PK",
                primaryDynamoDbRangeKey: "SK",
                cognitoUserPoolId: "cognito-user-pool-id"
            },
            region: "us-east-1",
            version: new SemVer("1.0.0")
        });

        expect(deployment.getTable(DynamoDBTableType.REGULAR)).toEqual({
            name: deployment.services.primaryDynamoDbName,
            arn: deployment.services.primaryDynamoDbArn,
            type: "regular"
        });
        expect(deployment.getTable(DynamoDBTableType.OPENSEARCH)).toEqual({
            name: deployment.services.opensearchDynamodbTableName,
            arn: deployment.services.opensearchDynamodbTableArn,
            type: "opensearch"
        });

        expect(() => {
            deployment.getTable("unknown" as any);
        }).toThrow(`Unknown table type "unknown".`);

        const deploymentWithoutOpensearch = createDeployment({
            name: "test#blue",
            env: "test",
            variant: "blue",
            services: {
                s3Id: "s3-id",
                s3Arn: "arn:aws:s3:::s3-bucket",
                primaryDynamoDbName: "primary-table",
                primaryDynamoDbArn: "arn:aws:dynamodb:region:account-id:table/primary-table",
                primaryDynamoDbHashKey: "PK",
                primaryDynamoDbRangeKey: "SK",
                opensearchDynamodbTableName: undefined,
                opensearchDynamodbTableArn: undefined,
                cognitoUserPoolId: "cognito-user-pool-id"
            },
            region: "us-east-1",
            version: new SemVer("1.0.0")
        });

        expect(() => {
            deploymentWithoutOpensearch.getTable(DynamoDBTableType.OPENSEARCH);
        }).toThrow(`Unknown table type "opensearch" - no data.`);
    });
});
