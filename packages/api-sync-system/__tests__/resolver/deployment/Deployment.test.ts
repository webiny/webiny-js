import { DynamoDBTableType } from "~/types.js";
import { createDeployment } from "~/resolver/deployment/Deployment.js";
import SemVer from "semver/classes/semver";

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
                elasticsearchDynamodbTableName: "elasticsearch-table",
                elasticsearchDynamodbTableArn:
                    "arn:aws:dynamodb:region:account-id:table/elasticsearch-table",
                logDynamodbTableName: "log-table",
                logDynamodbTableArn: "arn:aws:dynamodb:region:account-id:table/log-table",
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
        expect(deployment.getTable(DynamoDBTableType.ELASTICSEARCH)).toEqual({
            name: deployment.services.elasticsearchDynamodbTableName,
            arn: deployment.services.elasticsearchDynamodbTableArn,
            type: "elasticsearch"
        });
        expect(deployment.getTable(DynamoDBTableType.LOG)).toEqual({
            name: deployment.services.logDynamodbTableName,
            arn: deployment.services.logDynamodbTableArn,
            type: "log"
        });

        expect(() => {
            deployment.getTable("unknown" as any);
        }).toThrow(`Unknown table type "unknown".`);

        const deploymentWithoutElasticsearch = createDeployment({
            name: "test#blue",
            env: "test",
            variant: "blue",
            services: {
                s3Id: "s3-id",
                s3Arn: "arn:aws:s3:::s3-bucket",
                primaryDynamoDbName: "primary-table",
                primaryDynamoDbArn: "arn:aws:dynamodb:region:account-id:table/primary-table",
                logDynamodbTableName: "log-table",
                logDynamodbTableArn: "arn:aws:dynamodb:region:account-id:table/log-table",
                primaryDynamoDbHashKey: "PK",
                primaryDynamoDbRangeKey: "SK",
                elasticsearchDynamodbTableName: undefined,
                elasticsearchDynamodbTableArn: undefined,
                cognitoUserPoolId: "cognito-user-pool-id"
            },
            region: "us-east-1",
            version: new SemVer("1.0.0")
        });

        expect(() => {
            deploymentWithoutElasticsearch.getTable(DynamoDBTableType.ELASTICSEARCH);
        }).toThrow(`Unknown table type "elasticsearch" - no data.`);
    });
});
