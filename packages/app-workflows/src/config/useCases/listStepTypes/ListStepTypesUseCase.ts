import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListStepTypesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<EditorStepType[]> {
        return this.repository.listStepTypes();
    }
}

export const ListStepTypesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListStepTypesUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
