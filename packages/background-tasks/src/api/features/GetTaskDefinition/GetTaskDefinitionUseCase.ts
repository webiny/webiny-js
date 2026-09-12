import { Result } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import { GetTaskDefinitionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskHandlerResolver } from "~/api/features/TaskHandlerResolver/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import {
    TaskDefinitionNotFoundError,
    TaskDefinitionNotRunnableError
} from "~/api/domain/errors.js";

export class GetTaskDefinitionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private definitions: TaskDefinition.Interface[],
        private handlerResolver: TaskHandlerResolver.Interface,
        private logger: Logger.Interface
    ) {}

    public execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(id: string): Result<TaskDefinition.Runnable<I, O>, UseCaseAbstraction.Error> {
        for (const definition of this.definitions) {
            if (definition.id !== id) {
                continue;
            }

            // New shape: the definition names a handler class, built only now that we know this is
            // the task being asked for. Its dependencies are never touched for the other 28.
            if (definition.handler) {
                // The registered definition is stored under the abstraction's default generics, so
                // its handler cannot be proven assignable to the caller's narrower <I, O>. Same
                // reason the legacy branch below casts.
                const handler = this.handlerResolver.resolve(
                    definition.handler as Constructor<TaskDefinition.Handler<I, O>>
                );
                return Result.ok(toRunnable<I, O>(definition, handler, this.logger));
            }

            // Old shape: the definition carries `run()` and the hooks itself, so it IS the handler.
            if (typeof definition.run === "function") {
                return Result.ok(definition as TaskDefinition.Runnable<I, O>);
            }

            return Result.fail(new TaskDefinitionNotRunnableError(id));
        }

        return Result.fail(new TaskDefinitionNotFoundError(id));
    }
}

type HookName = "onBeforeTrigger" | "onDone" | "onError" | "onAbort" | "onMaxIterations";

/**
 * Present the two halves as the single object the runner and `context.tasks.getDefinition()` expect.
 * Metadata reads come from the definition, behaviour from the handler.
 *
 * Hooks come from BOTH, in that order, because they mean different things. The handler's hook is the
 * task author's, and the definition's is whatever a decorator added: `SelfCleaningTaskDecorator`
 * supplies an `onDone` that deletes the finished task. Taking only the handler's would silently drop
 * every definition-level decorator, and taking only the definition's would drop the task's own.
 *
 * The handler's hook is guarded so a throwing user hook still lets the decorator's half run, which is
 * what the old single-object implementation did via its own `safeCall`.
 */
const toRunnable = <I extends TaskDefinition.TaskInput, O extends TaskDefinition.TaskOutput>(
    definition: TaskDefinition.Interface,
    handler: TaskDefinition.Handler<I, O>,
    logger: Logger.Interface
): TaskDefinition.Runnable<I, O> => {
    const chain = (name: HookName) => {
        const own = handler[name]?.bind(handler);
        const decorated = definition[name]?.bind(definition);

        if (!own && !decorated) {
            return undefined;
        }

        return async (params: any) => {
            if (own) {
                try {
                    await own(params);
                } catch (error) {
                    logger.error(
                        { error, taskId: definition.id, hook: name },
                        "Error executing task lifecycle hook."
                    );
                }
            }
            await decorated?.(params);
        };
    };

    return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        isPrivate: definition.isPrivate as boolean,
        databaseLogs: definition.databaseLogs as boolean,
        maxIterations: definition.maxIterations as number,
        selfCleanup: definition.selfCleanup,

        run: handler.run.bind(handler),
        onBeforeTrigger: chain("onBeforeTrigger"),
        onDone: chain("onDone"),
        onError: chain("onError"),
        onAbort: chain("onAbort"),
        onMaxIterations: chain("onMaxIterations"),
        createInputValidation: handler.createInputValidation?.bind(handler)
    };
};

export const GetTaskDefinitionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskDefinitionUseCaseImpl,
    dependencies: [[TaskDefinition, { multiple: true }], TaskHandlerResolver, Logger]
});
