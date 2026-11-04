import type { Container } from "@webiny/di";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Result } from "@webiny/feature/api";
import { TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";
import { triggeredTasks } from "./FakeTaskService.js";

/**
 * Package-local `FakeGetTask` (R157, P1; Task 14 wrote the api-workflows one). Single review reads
 * run stuck detection (R152), which reads the step's task: after a restart the step is `inReview`
 * with a task the fake task service "triggered", so the read must find it running, as the
 * requester (the stale guard compares `createdBy`). The context's `NoopGetTask` answers not found,
 * which stuck detection would treat as a lost task and fail the step.
 */
export class FakeGetTask implements GetTaskUseCase.Interface {
    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): GetTaskUseCase.Return<I, O> {
        const triggered = triggeredTasks.find(task => task.id === id);
        if (!triggered) {
            return Result.fail(new TaskNotFoundError());
        }
        return Result.ok({
            id,
            name: triggered.name ?? "",
            definitionId: triggered.definition,
            executionName: "",
            input: {},
            iterations: 1,
            taskStatus: TaskDataStatus.RUNNING,
            eventResponse: undefined,
            createdOn: "2026-10-13T10:00:00.000Z",
            savedOn: "2026-10-13T10:00:00.000Z",
            createdBy: { id: triggered.identityId, displayName: "", type: triggered.identityType }
        } as never);
    }
}

/** Replaces the context's `NoopGetTask` (`legacyPlugins`: function plugins run last, last wins). */
export const registerFakeGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new FakeGetTask());
};
