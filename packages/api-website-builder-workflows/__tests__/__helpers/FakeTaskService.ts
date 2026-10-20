import type { Container } from "@webiny/di";
import { BaseError, Result } from "@webiny/feature/api";
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

export type FakeTaskFault = "none" | "fail" | "throw";

export interface FakeTaskFaults {
    trigger: FakeTaskFault;
    abort: FakeTaskFault;
    /** The message of a failed or thrown `trigger`; the default when `null`. */
    triggerMessage: string | null;
}

/** Every `trigger` call, in order. Clear it with `resetFakeTasks()` in `beforeEach`. */
export const triggeredTasks: TriggeredTask[] = [];
/** Every `abort` call, in order. */
export const abortedTasks: AbortedTask[] = [];
/** Set `trigger` or `abort` to `"fail"` (failed Result) or `"throw"` for the next calls; the messages carry no trailing period because the engine's fail reasons append one. */
export const fakeTaskFaults: FakeTaskFaults = {
    trigger: "none",
    abort: "none",
    triggerMessage: null
};

interface FakeTaskErrorParams {
    message: string;
}

/** `BaseError` has a protected constructor; the fake fails with this subclass. */
class FakeTaskError extends BaseError {
    public override readonly code = "FakeTask/Error";

    public constructor(params: FakeTaskErrorParams) {
        super(params);
    }
}

let nextTaskNumber = 1;

export const resetFakeTasks = (): void => {
    triggeredTasks.length = 0;
    abortedTasks.length = 0;
    fakeTaskFaults.trigger = "none";
    fakeTaskFaults.abort = "none";
    fakeTaskFaults.triggerMessage = null;
    nextTaskNumber = 1;
};

const NOW = "2026-10-09T10:00:00.000Z";

// `TaskService.trigger` and `abort` are generic over the task input and output; the fake returns a
// plain task, so the Results are cast with `as never` (a test helper, never production code).
class FakeTaskServiceImpl implements TaskService.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async trigger(params: Parameters<TaskService.Interface["trigger"]>[0]) {
        const identity = this.identityContext.getIdentity();
        const triggerMessage = fakeTaskFaults.triggerMessage;
        if (fakeTaskFaults.trigger === "throw") {
            throw new Error(triggerMessage ?? "The task service is down");
        }
        if (fakeTaskFaults.trigger === "fail") {
            return Result.fail(
                new FakeTaskError({ message: triggerMessage ?? "The task could not be created" })
            );
        }
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
        if (fakeTaskFaults.abort === "throw") {
            throw new Error("The task service is down");
        }
        if (fakeTaskFaults.abort === "fail") {
            return Result.fail(new FakeTaskError({ message: "The task could not be aborted" }));
        }
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

/** Unused: kept for parity with the api-workflows and CMS copies; registration goes through the decorator. */
export const FakeTaskService = TaskService.createImplementation({
    implementation: FakeTaskServiceImpl,
    dependencies: [IdentityContext]
});

/** Ignores the real (mock) task service it decorates and records the calls instead. */
class FakeTaskServiceDecorator extends FakeTaskServiceImpl {
    public constructor(
        identityContext: IdentityContext.Interface,
        _decoratee: TaskService.Interface
    ) {
        super(identityContext);
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
