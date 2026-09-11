import { Result } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import { GetTaskDefinitionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskHandlerResolver } from "~/api/features/TaskHandlerResolver/index.js";
import {
    TaskDefinitionNotFoundError,
    TaskDefinitionNotRunnableError
} from "~/api/domain/errors.js";

export class GetTaskDefinitionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private definitions: TaskDefinition.Interface[],
        private handlerResolver: TaskHandlerResolver.Interface
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
                return Result.ok(toRunnable<I, O>(definition, handler));
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

/**
 * Present the two halves as the single object the runner and `context.tasks.getDefinition()` expect.
 * Metadata reads come from the definition, behaviour from the handler, bound so `this` inside a hook
 * is still the handler instance that owns the injected dependencies.
 */
const toRunnable = <I extends TaskDefinition.TaskInput, O extends TaskDefinition.TaskOutput>(
    definition: TaskDefinition.Interface,
    handler: TaskDefinition.Handler<I, O>
): TaskDefinition.Runnable<I, O> => {
    return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        isPrivate: definition.isPrivate as boolean,
        databaseLogs: definition.databaseLogs as boolean,
        maxIterations: definition.maxIterations as number,
        selfCleanup: definition.selfCleanup,

        run: handler.run.bind(handler),
        onBeforeTrigger: handler.onBeforeTrigger?.bind(handler),
        onDone: handler.onDone?.bind(handler),
        onError: handler.onError?.bind(handler),
        onAbort: handler.onAbort?.bind(handler),
        onMaxIterations: handler.onMaxIterations?.bind(handler),
        createInputValidation: handler.createInputValidation?.bind(handler)
    };
};

export const GetTaskDefinitionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskDefinitionUseCaseImpl,
    dependencies: [[TaskDefinition, { multiple: true }], TaskHandlerResolver]
});
