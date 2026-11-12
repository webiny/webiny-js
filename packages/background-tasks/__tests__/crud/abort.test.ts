import { describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition.js";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";
import { UpdateTaskLogUseCase } from "~/api/features/UpdateTaskLog/index.js";
import { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";
import { TaskDataStatus } from "~/api/types";

describe("tasks - abort", () => {
    it("runs onAbort when the abort couldn't be written to the task log", async () => {
        const onAbort = vi.fn();
        const definition = createTaskDefinition({
            id: MOCK_TASK_DEFINITION_ID,
            title: "A task with cleanup on abort",
            run({ controller }) {
                return controller.response.done();
            },
            onAbort
        });
        const failingLogUpdate = (container: Container) => {
            const error = new BackgroundTaskPersistenceError(new Error("Write throttled."));
            container.registerInstance(UpdateTaskLogUseCase, {
                execute: async () => Result.fail(error)
            });
        };
        const handler = useRawHandler({ plugins: [definition, failingLogUpdate] });
        const context = await handler.handle();
        const service = context.container.resolve(TaskService);

        const triggered = await service.trigger({ definition: MOCK_TASK_DEFINITION_ID });
        const result = await service.abort({ id: triggered.value.id });

        expect(result.isOk()).toBeTrue();
        expect(result.value.taskStatus).toEqual(TaskDataStatus.ABORTED);
        expect(onAbort).toHaveBeenCalledTimes(1);
    });
});
