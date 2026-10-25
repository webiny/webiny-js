import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskDataStatus, TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export interface TriggeredTask {
    id: string;
    definition: string;
    name: string | undefined;
    input: TaskService.TaskInput | undefined;
    /** The identity in force when `trigger` was called (R149). */
    identityId: string;
    identityType: string;
}

export interface AbortedTask {
    id: string;
    message: string | undefined;
}

/** Every `trigger` call, in order. Clear it with `resetFakeTasks()` in `beforeEach`. */
export const triggeredTasks: TriggeredTask[] = [];
/** Every `abort` call, in order. */
export const abortedTasks: AbortedTask[] = [];

let nextTaskNumber = 1;

export const resetFakeTasks = (): void => {
    triggeredTasks.length = 0;
    abortedTasks.length = 0;
    nextTaskNumber = 1;
};

const NOW = "2026-10-09T10:00:00.000Z";

// `TaskService.trigger` and `abort` are generic over the task input and output; the fake returns a
// plain task, so the Results are cast with `as never` (a test helper, never production code).
/** Ignores the real (mock) task service it decorates and records the calls instead. */
class FakeTaskServiceDecorator implements TaskService.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        _decoratee: TaskService.Interface
    ) {}

    public async trigger(params: Parameters<TaskService.Interface["trigger"]>[0]) {
        const identity = this.identityContext.getIdentity();
        const id = `task-${nextTaskNumber++}`;
        triggeredTasks.push({
            id,
            definition: params.definition,
            name: params.name,
            input: params.input,
            identityId: identity.id,
            identityType: identity.type
        });
        return Result.ok({
            id,
            name: params.name ?? "",
            definitionId: params.definition,
            executionName: "",
            input: params.input ?? {},
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: identity.id, displayName: identity.displayName, type: identity.type }
        }) as never;
    }

    public async abort(params: Parameters<TaskService.Interface["abort"]>[0]) {
        abortedTasks.push({ id: params.id, message: params.message });
        return Result.ok({
            id: params.id,
            name: "",
            definitionId: "",
            executionName: "",
            input: {},
            iterations: 0,
            taskStatus: TaskDataStatus.ABORTED,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: "", displayName: "", type: "" }
        }) as never;
    }

    public async fetchServiceInfo() {
        return Result.ok({}) as never;
    }
}

/**
 * Replaces the WB context's task service for the test (`legacyPlugins`). The WB handler registers
 * a mock task service instance that wins over a plain registration, so the fake decorates it.
 */
export const registerFakeTaskService = (container: Container) => {
    container.registerDecorator(
        TaskService.createDecorator({
            decorator: FakeTaskServiceDecorator,
            dependencies: [IdentityContext]
        })
    );
};
