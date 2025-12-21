import { describe, expect, it, vi } from "vitest";
import { createDataSynchronization, DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import type { IDataSynchronizationInput, IFactories } from "~/tasks/dataSynchronization/types";
import { TaskDataStatus } from "@webiny/tasks/types";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

vi.mock("~/tasks/dataSynchronization/createFactories", () => {
    return {
        createFactories: (): IFactories => {
            return {
                elasticsearchToDynamoDb: ({ manager }) => {
                    return {
                        run: async input => {
                            return manager.controller.response.continue({
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
        const handler = useHandler({
            plugins: [createDataSynchronization()]
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

        // The new task system returns different response structure
        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(result.webinyTaskId).toBe(task.id);
        const taskCheck = await context.tasks.getTask(task.id);
        expect(taskCheck?.iterations).toEqual(2);
    });
});
