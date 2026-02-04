import { Result } from "@webiny/feature/api";
import { GetTaskDefinitionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskDefinitionNotFoundError } from "~/domain/errors.js";

class GetTaskDefinitionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private definitions: TaskDefinition.Interface[]) {}

    public execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(id: string): Result<TaskDefinition.Runnable<I, O>, UseCaseAbstraction.Error> {
        for (const definition of this.definitions) {
            if (definition.id === id) {
                return Result.ok(definition as TaskDefinition.Runnable<I, O>);
            }
        }

        return Result.fail(new TaskDefinitionNotFoundError(id));
    }
}

export const GetTaskDefinitionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskDefinitionUseCaseImpl,
    dependencies: [[TaskDefinition, { multiple: true }]]
});
