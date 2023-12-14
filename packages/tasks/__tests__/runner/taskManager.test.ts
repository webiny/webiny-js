import WebinyError from "@webiny/error";
import { TaskResponseStatus } from "~/types";
import { TaskManager } from "~/runner/TaskManager";
import {
    createMockContext,
    createMockEvent,
    createMockResponseFactory,
    createMockRunner
} from "~tests/mocks";
import { ResponseContinueResult, ResponseDoneResult, ResponseErrorResult } from "~/response";
import { createMockTask } from "~tests/mocks/task";
import { createMockTaskDefinition } from "~tests/mocks/definition";

describe("task manager", () => {
    const task = createMockTask();

    const taskDefinition = createMockTaskDefinition();

    it("should create a task manager", async () => {
        const factory = createMockResponseFactory();
        const manager = new TaskManager(
            createMockRunner(),
            createMockContext(),
            factory(createMockEvent()),
            task,
            taskDefinition
        );

        expect(manager).toBeDefined();
        expect(manager.run).toBeInstanceOf(Function);
    });

    it("should run a task and return continue immediately because timeout is close", async () => {
        const factory = createMockResponseFactory({});
        const manager = new TaskManager(
            createMockRunner({
                isCloseToTimeout: () => {
                    return true;
                }
            }),
            createMockContext(),
            factory(
                createMockEvent({
                    webinyTaskId: task.id
                })
            ),
            task,
            taskDefinition
        );

        const result = await manager.run();
        expect(result).toBeInstanceOf(ResponseContinueResult);
        expect(result).toEqual({
            status: TaskResponseStatus.CONTINUE,
            input: {},
            locale: "en-US",
            tenant: "root",
            message: undefined,
            webinyTaskId: task.id
        });
    });

    it("should run a task and update the task data to a running state - mock", async () => {
        const factory = createMockResponseFactory({});
        const manager = new TaskManager(
            createMockRunner(),
            createMockContext(),
            factory(
                createMockEvent({
                    webinyTaskId: task.id
                })
            ),
            task,
            createMockTaskDefinition({
                run: async params => {
                    return params.response.done();
                }
            })
        );
        const result = await manager.run();
        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            status: TaskResponseStatus.DONE,
            locale: "en-US",
            tenant: "root",
            message: undefined,
            webinyTaskId: task.id
        });
    });

    it("should run a task and return an error on updating task data status to running  - mock", async () => {
        const factory = createMockResponseFactory({});
        const manager = new TaskManager(
            createMockRunner(),
            createMockContext({
                tasks: {
                    updateTask: async (id, data) => {
                        throw new WebinyError("Error thrown on update task.", "UPDATE_TASK_ERROR", {
                            id,
                            data
                        });
                    }
                }
            }),
            factory(
                createMockEvent({
                    webinyTaskId: task.id
                })
            ),
            task,
            createMockTaskDefinition({
                run: async params => {
                    return params.response.done();
                }
            })
        );
        const result = await manager.run();
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                message: "Error thrown on update task.",
                code: "UPDATE_TASK_ERROR",
                data: {
                    id: "myCustomTaskDataId",
                    data: {
                        status: "running",
                        log: [
                            {
                                message: "Task started.",
                                createdOn: expect.any(String)
                            }
                        ]
                    }
                },
                stack: expect.any(String)
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskId: task.id
        });
    });
});
