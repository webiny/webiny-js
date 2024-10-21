import { ElasticsearchToDynamoDbSynchronization } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchToDynamoDbSynchronization";
import { useHandler } from "~tests/helpers/useHandler";
import { createManagers } from "./managers";

describe("ElasticsearchToDynamoDbSynchronization", () => {
    it("should run a sync without any indexes and return a continue response", async () => {
        const handler = useHandler();

        const context = await handler.rawHandle();

        const managers = createManagers({
            context
        });

        const sync = new ElasticsearchToDynamoDbSynchronization(managers);

        const result = await sync.run({});

        expect(result).toEqual({
            delay: -1,
            input: {
                elasticsearchToDynamoDb: {
                    finished: true
                }
            },
            locale: "en-US",
            message: undefined,
            status: "continue",
            tenant: "root",
            wait: undefined,
            webinyTaskDefinitionId: "mockDefinitionId",
            webinyTaskId: "mockEventId"
        });
    });
});
