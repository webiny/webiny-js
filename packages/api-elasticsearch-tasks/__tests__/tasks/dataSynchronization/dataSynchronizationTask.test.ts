import { createDataSynchronization, DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import { TaskDefinitionPlugin, TaskResponseStatus } from "@webiny/tasks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { IDataSynchronizationInput, IFactories } from "~/tasks/dataSynchronization/types";

jest.mock("~/tasks/dataSynchronization/createFactories", () => {
    return {
        createFactories: (): IFactories => {
            return {
                createElasticsearchToDynamoDb: ({ manager }) => {
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
                },
                createDynamoDbElasticsearch: ({ manager }) => {
                    return {
                        run: async input => {
                            return manager.response.continue({
                                ...input,
                                dynamoDbElasticsearch: {
                                    finished: true
                                }
                            });
                        }
                    };
                },
                createDynamoDb: ({ manager }) => {
                    return {
                        run: async () => {
                            return manager.response.done("DynamoDB sync finished.");
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
                maxIterations: 50,
                disableDatabaseLogs: true,
                fields: [],
                run: expect.any(Function)
            }
        });
    });

    it("should run a task but end in error because of the input", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask<IDataSynchronizationInput>({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                elasticsearchToDynamoDb: {
                    finished: true
                },
                dynamoDbElasticsearch: {
                    finished: true
                },
                dynamoDb: {
                    finished: true
                }
            },
            name: "Data Sync Mock Task"
        });

        const runner = createRunner({
            context,
            task: createDataSynchronization()
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toEqual({
            status: TaskResponseStatus.ERROR,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: DATA_SYNCHRONIZATION_TASK,
            tenant: "root",
            locale: "en-US",
            error: {
                message: "Should not reach this point.",
                data: {
                    input: {
                        dynamoDb: {
                            finished: true
                        },
                        dynamoDbElasticsearch: {
                            finished: true
                        },
                        elasticsearchToDynamoDb: {
                            finished: true
                        }
                    }
                }
            }
        });
        /**
         * Should not have more than one iteration.
         */
        const taskCheck = await context.tasks.getTask(task.id);
        expect(taskCheck?.iterations).toEqual(1);
    });

    it("should run a task and end with done from dynamodb sync", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask<IDataSynchronizationInput>({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {},
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
            locale: "en-US",
            message: "DynamoDB sync finished.",
            output: undefined
        });
        /**
         * Should have more than one iteration.
         */
        const taskCheck = await context.tasks.getTask(task.id);
        expect(taskCheck?.iterations).toEqual(3);
    });
});
