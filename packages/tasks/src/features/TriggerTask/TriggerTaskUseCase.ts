import { Result } from "@webiny/feature/api";
import { TriggerTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerTaskRepository } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskDefinitionUseCase } from "~/features/GetTaskDefinition/index.js";
import { TaskDefinitionNotFoundError } from "~/domain/errors.js";

class TriggerTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getDefinitionUseCase: GetTaskDefinitionUseCase.Interface,
        private repository: TriggerTaskRepository.Interface
    ) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: UseCaseAbstraction.Params<I>
    ): Promise<Result<TaskService.Task<I, O>, UseCaseAbstraction.Error>> {
        const { definition: definitionId, input: inputValues, name, parent, delay = 0 } = params;

        const definitionResult = this.getDefinitionUseCase.execute<I, O>(definitionId);

        if (definitionResult.isFail()) {
            return Result.fail(new TaskDefinitionNotFoundError(definitionId));
        }

        const definition = definitionResult.value;

        const taskData: TaskDefinition.TaskCreateData<I> = {
            name: name || definition.title,
            definitionId,
            input: inputValues || ({} as I),
            parentId: parent?.id
        };

        if (definition.onBeforeTrigger) {
            await definition.onBeforeTrigger({ data: taskData });
        }

        const repositoryResult = await this.repository.execute<I, O>({
            taskData,
            delay
        });

        if (repositoryResult.isFail()) {
            return Result.fail(repositoryResult.error);
        }

        return Result.ok(repositoryResult.value);
    }
}

export const TriggerTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerTaskUseCaseImpl,
    dependencies: [GetTaskDefinitionUseCase, TriggerTaskRepository]
});
