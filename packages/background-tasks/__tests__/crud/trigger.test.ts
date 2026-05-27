import { describe, expect, it } from "vitest";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createMockTaskDefinitions, MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";
import { createMockIdentity } from "~tests/mocks/identity";
import { TaskDataStatus } from "~/api/types";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

describe("tasks - trigger crud", () => {
    const handler = useRawHandler({
        plugins: [...createMockTaskDefinitions()]
    });

    it("should trigger a task", async () => {
        const context = await handler.handle();

        const service = context.container.resolve(TaskService);

        const result = await service.trigger({
            definition: "myCustomTaskNumber1",
            name: "A test of triggering task",
            input: {
                myAnotherCustomValue: "myAnotherCustomValue",
                myCustomValue: "myCustomValue"
            }
        });

        expect(result.isOk()).toBeTrue();

        expect(result.value).toEqual({
            id: expect.toBeString(),
            name: "A test of triggering task",
            definitionId: "myCustomTaskNumber1",
            executionName: "",
            input: {
                myAnotherCustomValue: "myAnotherCustomValue",
                myCustomValue: "myCustomValue"
            },
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            createdBy: createMockIdentity(),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            startedOn: undefined,
            finishedOn: undefined,
            eventResponse: expect.any(Object)
        });
    });

    it("should validate input before triggering the task", async () => {
        const definition = createTaskDefinition({
            id: MOCK_TASK_DEFINITION_ID,
            title: "A custom task defined via method",
            run({ input, controller }) {
                try {
                    if (controller.runtime.isCloseToTimeout()) {
                        return controller.response.continue({
                            ...input
                        });
                    }
                    return controller.response.done("Task done!", {
                        withSomeBoolean: true,
                        withSomeNumber: 1,
                        withSomeString: "yes!",
                        withSomeObject: {
                            testingObject: "yes!"
                        }
                    });
                } catch (ex) {
                    return controller.response.error(ex);
                }
            },
            createInputValidation: ({ validator }) => {
                return {
                    file: validator.string(),
                    page: validator.number(),
                    take: validator.boolean()
                };
            }
        });

        const handler = useRawHandler({
            plugins: [definition]
        });

        const context = await handler.handle();

        try {
            const result = await context.tasks.trigger({
                definition: MOCK_TASK_DEFINITION_ID,
                name: "A test of triggering task",
                input: {
                    wrongValueKey: "wrong",
                    anotherWrongValueKey: "wrong again"
                }
            });
            expect(result.value).toEqual("Should not reach this point.");
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.data).toEqual({
                invalidFields: {
                    file: {
                        code: "invalid_type",
                        data: {
                            path: ["file"]
                        },
                        message: "Invalid input: expected string, received undefined"
                    },
                    page: {
                        code: "invalid_type",
                        data: {
                            path: ["page"]
                        },
                        message: "Invalid input: expected number, received undefined"
                    },
                    take: {
                        code: "invalid_type",
                        data: {
                            path: ["take"]
                        },
                        message: "Invalid input: expected boolean, received undefined"
                    }
                }
            });
        }

        const input = {
            file: "correct",
            page: 1,
            take: false
        };

        try {
            const result = await context.tasks.trigger({
                definition: MOCK_TASK_DEFINITION_ID,
                name: "A test of triggering task",
                input
            });
            expect(result.value).toMatchObject({
                id: expect.any(String),
                input
            });
        } catch (ex) {
            expect(ex.message).toEqual("Should not reach this point.");
        }
    });
});
