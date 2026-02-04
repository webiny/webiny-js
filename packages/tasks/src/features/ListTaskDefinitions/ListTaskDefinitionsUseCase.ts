import { ListTaskDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

class ListTaskDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private definitions: TaskDefinition.Interface[]) {}

    public execute(): TaskDefinition.Interface[] {
        return this.definitions;
    }
}

export const ListTaskDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTaskDefinitionsUseCaseImpl,
    dependencies: [[TaskDefinition, { multiple: true }]]
});
