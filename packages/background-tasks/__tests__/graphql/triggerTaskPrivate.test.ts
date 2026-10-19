import { describe, expect, it } from "vitest";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { TaskDataStatus } from "~/api/types";

const PRIVATE_ID = "privateTestingTask";
const UNKNOWN_ID = "doesNotExistTask";

const createPrivateTaskDefinition = () => {
    return createTaskDefinition({
        id: PRIVATE_ID,
        title: "A private task",
        isPrivate: true,
        run({ controller }) {
            return controller.response.done("ran the private task");
        }
    });
};

describe("graphql - triggerTask refuses private definitions", () => {
    const plugins = [...createMockTaskDefinitions(), createPrivateTaskDefinition()];
    const handler = useGraphQLHandler({ plugins });
    const rawHandler = useRawHandler({ plugins });

    it("refuses a private definition as unknown", async () => {
        const privateResult = await handler.triggerTask({
            definition: PRIVATE_ID,
            name: "Forged private run",
            input: { reviewId: "review-1", stepId: "step-1" }
        });

        expect(privateResult).toEqual({
            data: {
                backgroundTasks: {
                    triggerTask: {
                        data: null,
                        error: {
                            message: "Task definition not found.",
                            code: "BackgroundTasks/TaskDefinition/NotFoundError",
                            data: { id: PRIVATE_ID }
                        }
                    }
                }
            }
        });
    });

    it("answers a private definition exactly like an unknown one", async () => {
        const privateResult = await handler.triggerTask({ definition: PRIVATE_ID });
        const unknownResult = await handler.triggerTask({ definition: UNKNOWN_ID });

        const privateError = privateResult.data.backgroundTasks.triggerTask.error;
        const unknownError = unknownResult.data.backgroundTasks.triggerTask.error;

        expect(privateError).not.toBeNull();
        expect(unknownError).toEqual({
            message: "Task definition not found.",
            code: "BackgroundTasks/TaskDefinition/NotFoundError",
            data: { id: UNKNOWN_ID }
        });
        expect({ ...privateError, data: undefined }).toEqual({ ...unknownError, data: undefined });
        expect(privateError!.data).toEqual({ id: PRIVATE_ID });
    });

    it("creates no task when a private definition is refused", async () => {
        await handler.triggerTask({ definition: PRIVATE_ID, name: "Forged private run" });

        const listResult = await handler.listTasks();

        expect(listResult.data.backgroundTasks.listTasks.data).toEqual([]);
    });

    it("still triggers a public definition", async () => {
        const result = await handler.triggerTask({
            definition: "myCustomTaskNumber1",
            name: "A public run"
        });

        expect(result.data.backgroundTasks.triggerTask.error).toBeNull();
        expect(result.data.backgroundTasks.triggerTask.data).toMatchObject({
            definitionId: "myCustomTaskNumber1",
            name: "A public run",
            taskStatus: TaskDataStatus.PENDING
        });
    });

    it("does not list the private definition", async () => {
        const result = await handler.listDefinitions();

        const ids = result.data.backgroundTasks.listDefinitions.data!.map(
            (item: { id: string }) => item.id
        );

        expect(ids).not.toContain(PRIVATE_ID);
    });

    it("keeps internal triggers of a private definition working", async () => {
        const context = await rawHandler.handle();

        const result = await context.container.resolve(TaskService).trigger({
            definition: PRIVATE_ID,
            name: "Internal private run",
            input: { reviewId: "review-1", stepId: "step-1" }
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            definitionId: PRIVATE_ID,
            name: "Internal private run",
            taskStatus: TaskDataStatus.PENDING
        });
    });
});
