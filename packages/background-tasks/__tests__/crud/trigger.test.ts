import { describe, expect, it } from "vitest";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createMockTaskDefinitions, MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";
import { createMockIdentity } from "~tests/mocks/identity";
import { TaskDataStatus } from "~/api/types";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/index.js";
import { TaskService as TaskTransport } from "~/api/domain/TaskService.js";
import { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { UpdateTaskUseCase } from "~/api/features/UpdateTask/index.js";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

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

    it("stores the identity active at trigger as the task's createdBy", async () => {
        // Contract the workflows step run guard relies on (R148, R149): the automation reach
        // triggers inside `withIdentity(requester)` and the run handler compares the stored
        // `createdBy.id` with the review's requester.
        const context = await handler.handle();
        const identityContext = context.container.resolve(IdentityContext);
        const service = context.container.resolve(TaskService);
        const requester = new AuthenticatedIdentity({
            id: "requester-1",
            displayName: "Another Person",
            type: "admin"
        });
        expect(requester.id).not.toBe(createMockIdentity().id);

        const triggered = await identityContext.withIdentity(requester, () => {
            return service.trigger({
                definition: "myCustomTaskNumber1",
                name: "A task triggered as another identity",
                input: {
                    myAnotherCustomValue: "myAnotherCustomValue",
                    myCustomValue: "myCustomValue"
                }
            });
        });

        expect(triggered.isOk()).toBeTrue();
        const stored = await context.container.resolve(GetTaskUseCase).execute(triggered.value.id);
        expect(stored.isOk()).toBeTrue();
        expect(stored.value.createdBy.id).toBe("requester-1");
        expect(stored.value.createdBy.id).not.toBe(createMockIdentity().id);
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

        const invalid = await context.container.resolve(TriggerTaskUseCase).execute({
            definition: MOCK_TASK_DEFINITION_ID,
            name: "A test of triggering task",
            input: {
                wrongValueKey: "wrong",
                anotherWrongValueKey: "wrong again"
            }
        });
        expect(invalid.isFail()).toBeTrue();
        expect(invalid.error.message).toEqual("Validation failed.");
        expect(invalid.error.data).toEqual({
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

        const input = {
            file: "correct",
            page: 1,
            take: false
        };

        const result = await context.container.resolve(TriggerTaskUseCase).execute({
            definition: MOCK_TASK_DEFINITION_ID,
            name: "A test of triggering task",
            input
        });
        expect(result.value).toMatchObject({
            id: expect.any(String),
            input
        });
    });

    it("returns a failure for a definition that isn't registered", async () => {
        const context = await handler.handle();
        const service = context.container.resolve(TaskService);

        const result = await service.trigger({ definition: "notRegistered" });

        expect(result.isFail()).toBeTrue();
        expect(result.error).toBeInstanceOf(TaskDefinitionNotFoundError);
        expect(result.error.data).toEqual({ id: "notRegistered" });
    });

    it("returns a failure for a delay longer than the maximum", async () => {
        const context = await handler.handle();
        const service = context.container.resolve(TaskService);

        const result = await service.trigger({
            definition: "myCustomTaskNumber1",
            delay: 400 * 24 * 60 * 60
        });

        expect(result.isFail()).toBeTrue();
        expect(result.error.code).toEqual("BackgroundTasks/Task/TriggerError");
        expect(result.error.message).toEqual("The maximum delay for a task is 355 days.");
    });

    it("returns a failure when the definition's onBeforeTrigger throws", async () => {
        const definition = createTaskDefinition({
            id: MOCK_TASK_DEFINITION_ID,
            title: "A task that refuses to start",
            run({ controller }) {
                return controller.response.done();
            },
            onBeforeTrigger: async () => {
                throw new Error("Index is not ready.");
            }
        });
        const handler = useRawHandler({ plugins: [definition] });
        const context = await handler.handle();

        const result = await context.container
            .resolve(TaskService)
            .trigger({ definition: MOCK_TASK_DEFINITION_ID });

        expect(result.isFail()).toBeTrue();
        expect(result.error.code).toEqual("BackgroundTasks/Task/TriggerError");
        expect(result.error.message).toEqual("Index is not ready.");
    });

    it("returns a failure and deletes the task when the transport can't send it", async () => {
        const failingTransport = (container: Container) => {
            container.registerInstance(TaskTransport, {
                send: async () => {
                    throw new Error("Step function is unavailable.");
                },
                fetch: async () => null
            });
        };
        const definitions = createMockTaskDefinitions();
        const handler = useRawHandler({
            plugins: [definitions, failingTransport]
        });
        const context = await handler.handle();

        const result = await context.container
            .resolve(TaskService)
            .trigger({ definition: "myCustomTaskNumber1" });

        expect(result.isFail()).toBeTrue();
        expect(result.error.code).toEqual("BackgroundTasks/Task/TriggerError");
        expect(result.error.message).toEqual("Step function is unavailable.");

        const tasks = await context.container.resolve(ListTasksUseCase).execute({});
        expect(tasks.value.items).toEqual([]);
    });

    it("returns the task when it was sent but its event response couldn't be stored", async () => {
        const failingUpdate = (container: Container) => {
            const error = new BackgroundTaskPersistenceError(new Error("Write throttled."));
            container.registerInstance(UpdateTaskUseCase, {
                execute: async () => Result.fail(error)
            });
        };
        const definitions = createMockTaskDefinitions();
        const handler = useRawHandler({
            plugins: [definitions, failingUpdate]
        });
        const context = await handler.handle();

        const result = await context.container
            .resolve(TaskService)
            .trigger({ definition: "myCustomTaskNumber1" });

        expect(result.isOk()).toBeTrue();
        expect(result.value).toMatchObject({
            definitionId: "myCustomTaskNumber1",
            eventResponse: { mockedSend: true }
        });
    });

    it("returns a failure when creating the task throws", async () => {
        const throwingCreate = (container: Container) => {
            container.registerInstance(CreateTaskUseCase, {
                execute: async () => {
                    throw new Error("After-create handler failed.");
                }
            });
        };
        const definitions = createMockTaskDefinitions();
        const handler = useRawHandler({
            plugins: [definitions, throwingCreate]
        });
        const context = await handler.handle();

        const result = await context.container
            .resolve(TaskService)
            .trigger({ definition: "myCustomTaskNumber1" });

        expect(result.isFail()).toBeTrue();
        expect(result.error.code).toEqual("BackgroundTasks/Task/TriggerError");
        expect(result.error.message).toEqual("After-create handler failed.");
    });
});
