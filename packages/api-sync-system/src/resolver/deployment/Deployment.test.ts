import { createMockDeployment } from "~tests/mocks/deployments.js";

describe("Deployment", () => {
    it("should get table information", () => {
        const deployment = createMockDeployment();

        expect(deployment.getTable("regular")).toEqual({
            name: deployment.services.primaryDynamoDbName,
            arn: deployment.services.primaryDynamoDbArn,
            type: "regular"
        });
        expect(deployment.getTable("elasticsearch")).toEqual({
            name: deployment.services.elasticsearchDynamodbTableName,
            arn: deployment.services.elasticsearchDynamodbTableArn,
            type: "elasticsearch"
        });
        expect(deployment.getTable("log")).toEqual({
            name: deployment.services.logDynamodbTableName,
            arn: deployment.services.logDynamodbTableArn,
            type: "log"
        });

        expect(() => {
            deployment.getTable("unknown" as any);
        }).toThrow(`Unknown table type "unknown".`);

        const deploymentWithoutElasticsearch = createMockDeployment({
            elasticsearchDynamodbTableName: undefined,
            elasticsearchDynamodbTableArn: undefined
        });

        expect(() => {
            deploymentWithoutElasticsearch.getTable("elasticsearch");
        }).toThrow(`Unknown table type "elasticsearch" - no data.`);
    });
});
