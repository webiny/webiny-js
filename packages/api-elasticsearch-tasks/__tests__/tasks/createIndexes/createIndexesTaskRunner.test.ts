import { Manager } from "~/tasks/Manager";
import { createContextMock } from "~tests/mocks/context";
import { createTaskManagerStoreMock } from "~tests/mocks/store";
import { Response, TaskResponse } from "@webiny/tasks";
import { createMockEvent } from "~tests/mocks/event";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createIndexManagerMock } from "~tests/mocks/indexManager";
import { CreateIndexesTaskRunner } from "~/tasks/createIndexes/CreateIndexesTaskRunner";
import { createElasticsearchIndexTaskPlugin } from "~/tasks/createIndexes/CreateElasticsearchIndexTaskPlugin";
import { PluginsContainer } from "@webiny/plugins";
import {
    createElasticsearchClient,
    ElasticsearchClient
} from "@webiny/project-utils/testing/elasticsearch/createClient";

describe("create indexes task runner", () => {
    let elasticsearchClient: ElasticsearchClient;

    beforeEach(async () => {
        elasticsearchClient = createElasticsearchClient();
    });

    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    it("should not create any indexes because of the missing index plugins", async () => {
        const manager = new Manager({
            context: createContextMock(),
            store: createTaskManagerStoreMock(),
            response: new TaskResponse(new Response(createMockEvent())),
            documentClient: getDocumentClient(),
            elasticsearchClient: createElasticsearchClient(),
            isCloseToTimeout: () => {
                return false;
            },
            isAborted: () => {
                return false;
            }
        });
        const indexManager = createIndexManagerMock();
        const runner = new CreateIndexesTaskRunner(manager, indexManager);

        const result = await runner.execute(undefined, []);

        expect(result).toEqual({
            locale: "en-US",
            message: "No index plugins found.",
            output: undefined,
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "mockDefinitionId",
            webinyTaskId: "mockEventId"
        });
    });

    it("should create indexes", async () => {
        const manager = new Manager({
            context: createContextMock({
                plugins: new PluginsContainer([
                    createElasticsearchIndexTaskPlugin({
                        name: "testing",
                        async getIndexList() {
                            return [
                                {
                                    index: "testing-index"
                                }
                            ];
                        }
                    })
                ])
            }),
            store: createTaskManagerStoreMock(),
            response: new TaskResponse(new Response(createMockEvent())),
            documentClient: getDocumentClient(),
            elasticsearchClient,
            isCloseToTimeout: () => {
                return false;
            },
            isAborted: () => {
                return false;
            }
        });
        const indexManager = createIndexManagerMock({
            client: elasticsearchClient
        });
        const runner = new CreateIndexesTaskRunner(manager, indexManager);

        const result = await runner.execute(undefined, []);

        expect(result).toEqual({
            locale: "en-US",
            message: "Indexes created.",
            output: {
                done: ["testing-index"]
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "mockDefinitionId",
            webinyTaskId: "mockEventId"
        });
    });
});
