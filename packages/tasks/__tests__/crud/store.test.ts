import { useHandler } from "~tests/helpers/useHandler";
import { createTaskDefinition } from "~/task";
import { ITask, TaskDataStatus } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createMockIdentity } from "~tests/mocks/identity";

describe("store crud", () => {
    const handler = useHandler({
        plugins: [
            createTaskDefinition({
                id: "testDefinition",
                title: "Test definition",
                async run({ response }) {
                    return response.done("successfully ran the task");
                }
            })
        ]
    });

    it("should return null when getting task which does not exist", async () => {
        const context = await handler.handle();

        const result = await context.tasks.getTask("non-existing-id");

        expect(result).toBeNull();
    });

    it("should return empty item array when listing tasks and no tasks are present", async () => {
        const context = await handler.handle();

        const result = await context.tasks.listTasks();

        expect(result).toEqual({
            items: [],
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            }
        });
    });

    it("should fail on creating a task which does not have a definition", async () => {
        const context = await handler.handle();

        let result: WebinyError | null = null;
        try {
            await context.tasks.createTask({
                name: "My Custom Task",
                definitionId: "non-existing-definition",
                input: {
                    someValue: true,
                    someOtherValue: 123
                }
            });
        } catch (ex) {
            result = ex;
        }

        expect(result).toBeInstanceOf(WebinyError);
        expect(result!.message).toEqual("There is no task definition.");
        expect(result!.code).toEqual("TASK_DEFINITION_ERROR");
        expect(result!.data).toEqual({
            id: "non-existing-definition"
        });
    });

    it("should fail on updating a task which does not exist", async () => {
        const context = await handler.handle();

        let result: any = null;

        try {
            await context.tasks.updateTask("non-existing-id", {});
        } catch (ex) {
            result = ex;
        }

        expect(result).toBeInstanceOf(NotFoundError);
    });

    it("should create, update and delete a task", async () => {
        const context = await handler.handle();

        const task = await context.tasks.createTask({
            name: "My Custom Task",
            definitionId: "testDefinition",
            input: {
                someValue: true,
                someOtherValue: 123
            }
        });
        const expectedCreatedTask: ITask = {
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            name: "My Custom Task",
            definitionId: "testDefinition",
            input: {
                someValue: true,
                someOtherValue: 123
            },
            iterations: 0,
            createdBy: createMockIdentity(),
            startedOn: undefined,
            finishedOn: undefined,
            eventResponse: undefined,
            executionName: "",
            taskStatus: TaskDataStatus.PENDING
        };
        expect(task).toEqual(expectedCreatedTask);

        const getTaskAfterCreate = await context.tasks.getTask(task.id);
        expect(getTaskAfterCreate).toEqual(expectedCreatedTask);

        const listTasksAfterCreate = await context.tasks.listTasks();
        expect(listTasksAfterCreate).toEqual({
            items: [expectedCreatedTask],
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });

        const updatedTask = await context.tasks.updateTask(task.id, {
            output: {
                myCustomOutput: "yes!"
            },
            input: {
                ...task.input,
                someValue: false,
                addedNewValue: "yes!"
            }
        });
        const expectedUpdatedTask: ITask = {
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            name: "My Custom Task",
            definitionId: "testDefinition",
            input: {
                someValue: false,
                someOtherValue: 123,
                addedNewValue: "yes!"
            },
            iterations: 0,
            createdBy: createMockIdentity(),
            startedOn: undefined,
            finishedOn: undefined,
            eventResponse: undefined,
            executionName: "",
            taskStatus: TaskDataStatus.PENDING,
            output: {
                myCustomOutput: "yes!"
            },
            parentId: undefined
        };
        expect(updatedTask).toEqual(expectedUpdatedTask);

        const getTaskAfterUpdate = await context.tasks.getTask(task.id);
        expect(getTaskAfterUpdate).toEqual(expectedUpdatedTask);

        const listTasksAfterUpdate = await context.tasks.listTasks();
        expect(listTasksAfterUpdate).toEqual({
            items: [expectedUpdatedTask],
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });

        const deletedTask = await context.tasks.deleteTask(task.id);
        expect(deletedTask).toBe(true);

        const getTaskAfterDelete = await context.tasks.getTask(task.id);
        expect(getTaskAfterDelete).toBeNull();

        const listTasksAfterDelete = await context.tasks.listTasks();
        expect(listTasksAfterDelete).toEqual({
            items: [],
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            }
        });
    });
});
