import { describe, expect, it, vi } from "vitest";
import { createDataSynchronization, DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import { TaskDefinitionPlugin, TaskResponseStatus } from "@webiny/tasks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import type { IDataSynchronizationInput, IFactories } from "~/tasks/dataSynchronization/types";

vi.mock("~/tasks/dataSynchronization/createFactories", () => {
    return {
        createFactories: (): IFactories => {
            return {
                elasticsearchToDynamoDb: ({ manager }) => {
                    return {
                        run: async input => {
                            return manager.response.continue({
                                ...input,
                                elasticsearchToDynamoDb: {
                                    finished: true
                                }
                            });
                        }
                    };
                }
            };
        }
    };
});

describe("data synchronization - elasticsearch", () => {
    it("should create a task definition", async () => {
        const result = createDataSynchronization();

        expect(result).toBeInstanceOf(TaskDefinitionPlugin);
        expect(result).toEqual({
            isPrivate: false,
            task: {
                id: DATA_SYNCHRONIZATION_TASK,
                isPrivate: false,
                title: "Data Synchronization",
                description: "Synchronize data between Elasticsearch and DynamoDB",
                maxIterations: 100,
                disableDatabaseLogs: true,
                fields: [],
                run: expect.any(Function),
                createInputValidation: expect.any(Function)
            }
        });
    });

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
                        code: "invalid_enum_value",
                        data: {
                            fatal: undefined,
                            path: ["flow"]
                        },
                        message:
                            "Invalid enum value. Expected 'elasticsearchToDynamoDb', received 'unknownFlow'"
                    }
                }
            });
        }
    });

    it("should run a task and end with done", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask<IDataSynchronizationInput>({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Data Sync Mock Task"
        });

        const runner = createRunner({
            context,
            task: createDataSynchronization(),
            onContinue: async () => {
                return;
            }
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toEqual({
            status: TaskResponseStatus.DONE,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: DATA_SYNCHRONIZATION_TASK,
            tenant: "root",
            message: undefined,
            output: undefined
        });
        const taskCheck = await context.tasks.getTask(task.id);
        expect(taskCheck?.iterations).toEqual(2);
    });
});
