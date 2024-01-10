import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { useHandler } from "~tests/helpers/useHandler";
import { ITaskLogItemType } from "~/types";
import { createMockIdentity } from "~tests/mocks/identity";

describe("graphql - logs", () => {
    const contextHandler = useHandler({
        plugins: [...createMockTaskDefinitions()]
    });
    const handler = useGraphQLHandler({
        plugins: [...createMockTaskDefinitions()]
    });

    it("should add first log entry", async () => {
        const context = await contextHandler.handle();

        const task = await context.tasks.createTask({
            name: "My Custom Task #1",
            definitionId: "myCustomTaskNumber1",
            input: {}
        });

        const log = await context.tasks.createLog(task, {
            executionName: "someExecutionName",
            iteration: 1
        });
        expect(log).toEqual({
            id: expect.any(String),
            createdBy: createMockIdentity(),
            createdOn: expect.toBeDateString(),
            task: task.id,
            iteration: 1,
            executionName: "someExecutionName",
            items: []
        });

        const result = await context.tasks.getLatestLog(task.id);
        expect(result).toEqual({
            id: expect.any(String),
            createdBy: createMockIdentity(),
            createdOn: expect.toBeDateString(),
            task: task.id,
            iteration: 1,
            executionName: "someExecutionName",
            items: []
        });
    });

    it("should list logs", async () => {
        const context = await contextHandler.handle();

        const task = await context.tasks.createTask({
            name: "My Custom Task #1",
            definitionId: "myCustomTaskNumber1",
            input: {}
        });

        const log1 = await context.tasks.createLog(task, {
            executionName: "someExecutionName",
            iteration: 1
        });

        const log2Item = {
            message: "someMessage",
            type: ITaskLogItemType.INFO,
            createdOn: new Date().toISOString()
        };
        const log2 = await context.tasks.updateLog(log1.id, {
            items: log1.items.concat(log2Item)
        });

        const log3Item = {
            message: "someMessage #2",
            type: ITaskLogItemType.INFO,
            createdOn: new Date().toISOString()
        };

        const log3 = await context.tasks.updateLog(log1.id, {
            items: log2.items.concat(log3Item)
        });

        const log4Item = {
            message: "someMessage",
            type: ITaskLogItemType.ERROR,
            createdOn: new Date().toISOString(),
            error: {
                message: "someErrorMessage",
                code: "SOME_ERROR_CODE",
                data: {
                    someData: "someData"
                }
            }
        };

        await context.tasks.updateLog(log1.id, {
            items: log3.items.concat(log4Item)
        });

        const logResult = await context.tasks.getLatestLog(task.id);
        expect(logResult).toEqual({
            id: log1.id,
            createdBy: createMockIdentity(),
            createdOn: expect.toBeDateString(),
            items: expect.any(Array),
            executionName: "someExecutionName",
            iteration: 1,
            task: task.id
        });
        expect(logResult.items).toHaveLength(3);

        const result = await handler.listTaskLogsQuery();

        expect(result).toEqual({
            data: {
                backgroundTasks: {
                    listLogs: {
                        data: [
                            {
                                id: expect.toBeString(),
                                createdBy: createMockIdentity(),
                                createdOn: expect.toBeDateString(),
                                task: {
                                    id: task.id
                                },
                                iteration: 1,
                                executionName: "someExecutionName",
                                items: [
                                    {
                                        ...log2Item,
                                        data: null,
                                        error: null
                                    },
                                    {
                                        ...log3Item,
                                        data: null,
                                        error: null
                                    },
                                    {
                                        ...log4Item,
                                        data: null
                                    }
                                ]
                            }
                        ],
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 1
                        },
                        error: null
                    }
                }
            }
        });
    });
});
