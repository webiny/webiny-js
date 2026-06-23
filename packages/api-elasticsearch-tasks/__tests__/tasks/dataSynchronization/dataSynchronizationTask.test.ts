import { describe, expect, it } from "vitest";
import { DATA_SYNCHRONIZATION_TASK } from "~/tasks/index.js";
import { createRunner } from "@webiny/project-utils/testing/tasks/index.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import type { IDataSynchronizationInput } from "~/tasks/dataSynchronization/types.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ElasticsearchToDynamoDbSynchronization } from "~/tasks/dataSynchronization/elasticsearch/abstractions/ElasticsearchToDynamoDbSynchronization.js";
import { Manager } from "~/abstractions/Manager.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

const createDummySync = () => {
    return createRegisterExtensionPlugin(({ container }) => {
        const DummySync = ElasticsearchToDynamoDbSynchronization.createImplementation({
            implementation: class {
                constructor(private readonly manager: Manager.Interface) {}

                async run(
                    input: ElasticsearchToDynamoDbSynchronization.Input,
                    _indexManager: ElasticsearchToDynamoDbSynchronization.IndexManager
                ): Promise<ElasticsearchToDynamoDbSynchronization.Result> {
                    return this.manager.controller.response.continue({
                        ...input,
                        elasticsearchToDynamoDb: {
                            finished: true
                        }
                    });
                }
            },
            dependencies: [Manager]
        });
        container.register(DummySync);
    });
};

describe("data synchronization - elasticsearch", () => {
    it("should run a task and end with error due to invalid flow", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        try {
            const task = await context.tasks.createTask<IDataSynchronizationInput>({
                definitionId: DATA_SYNCHRONIZATION_TASK,
                input: {
                    // @ts-expect-error
                    flow: "unknownFlow"
                },
                name: "Data Sync Mock Task"
            });
            expect(task).toEqual("Should not reach this point.");
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.data).toEqual({
                invalidFields: {
                    flow: {
                        code: "invalid_value",
                        data: {
                            fatal: undefined,
                            path: ["flow"]
                        },
                        message: `Invalid input: expected "elasticsearchToDynamoDb"`
                    }
                }
            });
        }
    });

    it("should run a task and end with done", async () => {
        const handler = useHandler({
            plugins: [createDummySync()]
        });

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask<IDataSynchronizationInput>({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Data Sync Mock Task"
        });

        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const taskDefinition = taskDefinitions.find(item => item.id === DATA_SYNCHRONIZATION_TASK)!;

        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {
                return;
            }
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        if (result.status === "error") {
            const taskCheck = await context.tasks.getTask(task.id);
            console.log("[DEBUG] Task error:", JSON.stringify(taskCheck?.taskStatus, null, 2));
            console.log(
                "[DEBUG] Task log:",
                JSON.stringify(taskCheck?.log?.items?.slice(-3), null, 2)
            );
        }
        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(result.webinyTaskId).toBe(task.id);
        const taskCheck = await context.tasks.getTask(task.id);
        expect(taskCheck?.iterations).toEqual(2);
    });
});
