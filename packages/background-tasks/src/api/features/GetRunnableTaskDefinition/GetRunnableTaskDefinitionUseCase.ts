import { Result } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import { GetRunnableTaskDefinitionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskHandlerResolver } from "~/api/features/TaskHandlerResolver/index.js";
import { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";

export class GetRunnableTaskDefinitionUseCaseImpl implements UseCaseAbstraction.Interface {
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

            // Every definition is free to build, so reaching this point cost nothing. The handler is
            // the expensive half and it is built only now, for the one task that was asked for.
            //
            // The registered definition is stored under the abstraction's default generics, so its
            // handler cannot be proven assignable to the caller's narrower <I, O>.
            const handlerClass = definition.handler as Constructor<TaskDefinition.Handler<I, O>>;
            const handler = this.handlerResolver.resolve(handlerClass);

            // Present the two halves as the single object the runner and
            // `context.tasks.getDefinition()` expect. Metadata from the definition, behaviour from
            // the handler, bound so `this` inside a hook is still the instance that owns the
            // injected dependencies.
            const runnable: TaskDefinition.Runnable<I, O> = {
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

            return Result.ok(runnable);
        }

        return Result.fail(new TaskDefinitionNotFoundError(id));
    }
}

export const GetRunnableTaskDefinitionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRunnableTaskDefinitionUseCaseImpl,
    dependencies: [[TaskDefinition, { multiple: true }], TaskHandlerResolver]
});
