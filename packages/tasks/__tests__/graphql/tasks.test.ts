import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { useHandler } from "~tests/helpers/useHandler";
import { TaskDataStatus } from "~/types";
import { createMockIdentity } from "~tests/mocks/identity";

describe("graphql - tasks", () => {
    const contextHandler = useHandler({
        plugins: [...createMockTaskDefinitions()]
    });
    const handler = useGraphQLHandler({
        plugins: [...createMockTaskDefinitions()]
    });

    it("should list tasks", async () => {
        const context = await contextHandler.handle();

        await context.tasks.createTask({
            name: "My Custom Task #1",
            definitionId: "myCustomTask-1",
            values: {
                someValue: true,
                someOtherValue: 123
            }
        });

        await context.tasks.createTask({
            name: "My Custom Task #2",
            definitionId: "myCustomTask-2",
            values: {
                someValue: false,
                someOtherValue: 4321
            }
        });

        await context.tasks.createTask({
            name: "My Custom Task #3",
            definitionId: "myCustomTask-3",
            values: {
                someValue: "yes!",
                someOtherValue: 12345678
            }
        });

        const response = await handler.listTasks();

        expect(response).toEqual({
            data: {
                backgroundTasks: {
                    listTasks: {
                        data: [
                            {
                                name: "My Custom Task #3",
                                definitionId: "myCustomTask-3",
                                values: {
                                    someValue: "yes!",
                                    someOtherValue: 12345678
                                },
                                id: expect.any(String),
                                status: TaskDataStatus.PENDING,
                                startedOn: null,
                                finishedOn: null,
                                createdBy: createMockIdentity(),
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                eventResponse: null
                            },
                            {
                                name: "My Custom Task #2",
                                definitionId: "myCustomTask-2",
                                values: {
                                    someValue: false,
                                    someOtherValue: 4321
                                },
                                id: expect.any(String),
                                status: TaskDataStatus.PENDING,
                                startedOn: null,
                                finishedOn: null,
                                createdBy: createMockIdentity(),
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                eventResponse: null
                            },
                            {
                                name: "My Custom Task #1",
                                definitionId: "myCustomTask-1",
                                values: {
                                    someValue: true,
                                    someOtherValue: 123
                                },
                                id: expect.any(String),
                                status: TaskDataStatus.PENDING,
                                startedOn: null,
                                finishedOn: null,
                                createdBy: createMockIdentity(),
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                eventResponse: null
                            }
                        ],
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 3
                        },
                        error: null
                    }
                }
            }
        });
    });
});
