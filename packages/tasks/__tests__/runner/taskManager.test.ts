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
import { createMockTaskResponse } from "~tests/mocks/taskResponse";
import { createMockTaskManagerStore } from "~tests/mocks/store";
import { createMockTaskLog } from "~tests/mocks/taskLog";

const mockTaskInputValues = {
    someInputValue: 1
};

describe("task manager", () => {
    const task = createMockTask({
        input: mockTaskInputValues
    });
    const taskLog = createMockTaskLog(task);

    const taskDefinition = createMockTaskDefinition();

    it("should create a task manager", async () => {
        const responseFactory = createMockResponseFactory();
        const response = responseFactory(
            createMockEvent({
                webinyTaskId: task.id
            })
        );
        const context = createMockContext();
        const manager = new TaskManager(
            createMockRunner(),
            createMockContext(),
            response,
            createMockTaskResponse(response),
            createMockTaskManagerStore({
                context,
                task
            })
        );

        expect(manager).toBeDefined();
        expect(manager.run).toBeInstanceOf(Function);
    });

    it("should run a task and return continue immediately because timeout is close", async () => {
        const responseFactory = createMockResponseFactory({});
        const response = responseFactory(
            createMockEvent({
                webinyTaskId: task.id
            })
        );
        const context = createMockContext();
        const manager = new TaskManager(
            createMockRunner({
                isCloseToTimeout: () => {
                    return true;
                }
            }),
            context,
            response,
            createMockTaskResponse(response),
            createMockTaskManagerStore({
                context,
                task,
                taskLog
            })
        );

        const result = await manager.run(taskDefinition);
        expect(result).toBeInstanceOf(ResponseContinueResult);
        expect(result).toEqual({
            status: TaskResponseStatus.CONTINUE,
            input: task.input,
            locale: "en-US",
            tenant: "root",
            message: undefined,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            wait: undefined
        });
    });

    it("should run a task and update the task data to a running state - mock", async () => {
        const responseFactory = createMockResponseFactory({});
        const response = responseFactory(
            createMockEvent({
                webinyTaskId: task.id
            })
        );
        const context = createMockContext();
        const definition = createMockTaskDefinition({
            run: async params => {
                return params.response.done();
            }
        });
        const manager = new TaskManager(
            createMockRunner(),
            context,
            response,
            createMockTaskResponse(response),
            createMockTaskManagerStore({
                context,
                task,
                taskLog
            })
        );
        const result = await manager.run(definition);
        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            status: TaskResponseStatus.DONE,
            locale: "en-US",
            tenant: "root",
            message: undefined,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id
        });
    });

    it("should run a task and return an error on updating task data status to running  - mock", async () => {
        const responseFactory = createMockResponseFactory({});
        const response = responseFactory(
            createMockEvent({
                webinyTaskId: task.id
            })
        );
        const context = createMockContext({
            tasks: {
                updateTask: async (id, data) => {
                    throw new WebinyError("Error thrown on update task.", "UPDATE_TASK_ERROR", {
                        id,
                        data
                    });
                }
            }
        });
        const definition = createMockTaskDefinition({
            run: async params => {
                return params.response.done();
            }
        });
        const manager = new TaskManager(
            createMockRunner(),
            context,
            responseFactory(
                createMockEvent({
                    webinyTaskId: task.id
                })
            ),
            createMockTaskResponse(response),
            createMockTaskManagerStore({
                context,
                task,
                taskLog
            })
        );
        const result = await manager.run(definition);
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                message: "Error thrown on update task.",
                code: "UPDATE_TASK_ERROR",
                data: {
                    id: "myCustomTaskDataId",
                    data: {
                        ...task,
                        iterations: 1,
                        executionName: "executionNameMock",
                        taskStatus: "running",
                        startedOn: expect.stringMatching(/^20/)
                    }
                },
                stack: expect.any(String)
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id
        });
    });
});
