import { TaskRunner } from "~/runner";
import { createMockEvent, createMockIdentity } from "~tests/mocks";
import { ResponseContinueResult, ResponseDoneResult } from "~/response";
import { TaskDataStatus } from "~/types";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";

describe("task runner trigger and end successfully", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should trigger a task run and end it successfully", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 5 * 60 * 1000;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );

        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            message: "Task is done!",
            output: {
                myCustomOutput: "yes!"
            }
        });

        const doneTask = await context.tasks.getTask(task.id);
        expect(doneTask?.taskStatus).toBe(TaskDataStatus.SUCCESS);
        expect(doneTask?.output).toEqual({
            myCustomOutput: "yes!"
        });

        const { items, meta } = await context.tasks.listLogs({
            where: {
                task: task.id
            }
        });
        expect(items).toMatchObject([
            {
                items: [
                    {
                        message: "Task is done!",
                        createdOn: expect.toBeDateString(),
                        type: "info"
                    }
                ]
            }
        ]);
        expect(items).toHaveLength(1);
        expect(items[0].items).toHaveLength(1);
        expect(meta.totalCount).toBe(1);
    });

    it("should trigger a task run and end it successfully in two iterations", async () => {
        const context = await contextFactory();

        const firstRunner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {
                aTaskInput: "yes"
            },
            name: "My task name"
        });

        const result = await firstRunner.run(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );

        expect(result).toBeInstanceOf(ResponseContinueResult);
        expect(result).toEqual({
            status: "continue",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            delay: -1,
            wait: undefined,
            message: undefined,
            input: {
                aTaskInput: "yes",
                continuing: true
            }
        });
        /**
         * Make sure that the data in the DB is correct.
         */
        const firstRunTask = await context.tasks.getTask(task.id);
        expect(firstRunTask).toEqual({
            taskStatus: TaskDataStatus.RUNNING,
            input: {
                aTaskInput: "yes",
                continuing: true
            },
            iterations: 1,
            name: "My task name",
            output: undefined,
            parentId: undefined,
            savedOn: expect.toBeDateString(),
            startedOn: expect.toBeDateString(),
            createdBy: createMockIdentity(),
            createdOn: expect.toBeDateString(),
            definitionId: "taskRunnerTask",
            eventResponse: undefined,
            executionName: "executionNameMock",
            finishedOn: undefined,
            id: task.id
        });

        /**
         * Second iteration of the task execution.
         */

        const secondRunner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 5 * 60 * 1000;
                }
            },
            context
        );
        const doneResult = await secondRunner.run(createMockEvent(result));

        expect(doneResult).toBeInstanceOf(ResponseDoneResult);
        expect(doneResult).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            message: "Task is done!",
            output: {
                myCustomOutput: "yes!"
            }
        });

        const secondRunTask = await context.tasks.getTask(task.id);
        expect(secondRunTask).toEqual({
            taskStatus: TaskDataStatus.SUCCESS,
            input: {
                aTaskInput: "yes",
                continuing: true
            },
            iterations: 2,
            name: "My task name",
            output: {
                myCustomOutput: "yes!"
            },
            parentId: undefined,
            savedOn: expect.toBeDateString(),
            startedOn: expect.toBeDateString(),
            createdBy: createMockIdentity(),
            createdOn: expect.toBeDateString(),
            definitionId: "taskRunnerTask",
            eventResponse: undefined,
            executionName: "executionNameMock",
            finishedOn: expect.toBeDateString(),
            id: task.id
        });
    });
});
