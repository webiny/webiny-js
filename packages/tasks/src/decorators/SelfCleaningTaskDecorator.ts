import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { SelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { normalizeSelfCleanup } from "~/utils/normalizeSelfCleanup.js";
import type { Context } from "~/types.js";
import { getErrorProperties } from "~/utils/getErrorProperties.js";

type LifecycleHook = TaskDefinition.Interface["onDone"];
type HookParams = Parameters<NonNullable<LifecycleHook>>[0];

export class SelfCleaningTaskDecoratorImpl implements TaskDefinition.Interface {
    private readonly events: ReadonlySet<SelfCleanupEvent>;

    public constructor(private decoratee: TaskDefinition.Interface) {
        this.events = normalizeSelfCleanup(decoratee.selfCleanup);
    }

    // Pass-through properties.
    get id() {
        return this.decoratee.id;
    }
    get title() {
        return this.decoratee.title;
    }
    get description() {
        return this.decoratee.description;
    }
    get isPrivate() {
        return this.decoratee.isPrivate;
    }
    get maxIterations() {
        return this.decoratee.maxIterations;
    }
    get selfCleanup() {
        return this.decoratee.selfCleanup;
    }
    get createInputValidation() {
        return this.decoratee.createInputValidation;
    }
    get run() {
        return this.decoratee.run.bind(this.decoratee);
    }
    get onBeforeTrigger() {
        return this.decoratee.onBeforeTrigger?.bind(this.decoratee);
    }
    get onMaxIterations() {
        return this.decoratee.onMaxIterations?.bind(this.decoratee);
    }

    // databaseLogs override — any non-empty event set forces false.
    get databaseLogs() {
        if (this.events.size > 0) {
            return false;
        }
        return this.decoratee.databaseLogs;
    }

    // Always-defined lifecycle hooks. Each runs the user's hook first, then
    // triggers cleanup if the matching event is in the set.
    get onDone() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onDone, params, "onDone");
            if (this.events.has("onSuccess")) {
                await this.runCleanup(params);
            }
        };
    }

    get onError() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onError, params, "onError");
            if (this.events.has("onError")) {
                await this.runCleanup(params);
            }
        };
    }

    get onAbort() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onAbort, params, "onAbort");
            if (this.events.has("onAbort")) {
                await this.runCleanup(params);
            }
        };
    }

    private async runCleanup(params: HookParams): Promise<void> {
        const context = params.context as Context;
        await context.tasks.cleanupTaskSubtree(params.task.id);
    }

    private async safeCall(
        hook: LifecycleHook | undefined,
        params: HookParams,
        name: string
    ): Promise<void> {
        if (!hook) {
            return;
        }
        try {
            await hook.call(this.decoratee, params);
        } catch (ex) {
            console.error(`Error executing ${name} hook for task "${params.task.id}".`);
            console.log(getErrorProperties(ex));
        }
    }
}

export const SelfCleaningTaskDecorator = TaskDefinition.createDecorator({
    decorator: SelfCleaningTaskDecoratorImpl,
    dependencies: []
});
