import { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { normalizeSelfCleanup } from "~/api/utils/normalizeSelfCleanup.js";
import { CleanupTaskSubtreeUseCase } from "~/api/features/CleanupTaskSubtree/index.js";
import { getErrorProperties } from "~/api/utils/getErrorProperties.js";

type HookParams = TaskHandler.LifecycleHookParams;

/**
 * Deletes a finished task, and its descendants, for the events its definition asked for.
 *
 * Registered against `TaskHandler`, so it wraps every task's handler. Which task it is wrapping, and
 * whether that task wants cleaning up, both come from `params.definition` rather than from anything
 * captured at construction: one decorator instance serves whichever handler is resolved.
 *
 * The user's hook runs first and its failure is swallowed, so a task that throws on the way out is
 * still cleaned up. That is what the previous single-object implementation did.
 */
export class SelfCleaningTaskHandlerDecoratorImpl implements TaskHandler.Interface {
    public constructor(
        private readonly cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface,
        private readonly logger: Logger.Interface,
        private readonly decoratee: TaskHandler.Interface
    ) {}

    get run() {
        return this.decoratee.run.bind(this.decoratee);
    }

    get onBeforeTrigger() {
        return this.decoratee.onBeforeTrigger?.bind(this.decoratee);
    }

    get onMaxIterations() {
        return this.decoratee.onMaxIterations?.bind(this.decoratee);
    }

    get createInputValidation() {
        return this.decoratee.createInputValidation?.bind(this.decoratee);
    }

    get onDone() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onDone, params, "onDone");
            await this.cleanUpIfAsked(params, "onSuccess");
        };
    }

    get onError() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onError, params, "onError");
            await this.cleanUpIfAsked(params, "onError");
        };
    }

    get onAbort() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onAbort, params, "onAbort");
            await this.cleanUpIfAsked(params, "onAbort");
        };
    }

    private async cleanUpIfAsked(
        params: HookParams,
        event: "onSuccess" | "onError" | "onAbort"
    ): Promise<void> {
        const events = normalizeSelfCleanup(params.definition.selfCleanup);
        if (!events.has(event)) {
            return;
        }

        await this.cleanupTaskSubtree.execute(params.task.id);
    }

    private async safeCall(
        hook: TaskHandler.Interface["onDone"],
        params: HookParams,
        name: string
    ): Promise<void> {
        if (!hook) {
            return;
        }

        try {
            await hook.call(this.decoratee, params);
        } catch (ex) {
            this.logger.error(
                { error: getErrorProperties(ex), taskId: params.task.id, hook: name },
                "Error executing task lifecycle hook."
            );
        }
    }
}

export const SelfCleaningTaskHandlerDecorator = TaskHandler.createDecorator({
    decorator: SelfCleaningTaskHandlerDecoratorImpl,
    dependencies: [CleanupTaskSubtreeUseCase, Logger]
});
