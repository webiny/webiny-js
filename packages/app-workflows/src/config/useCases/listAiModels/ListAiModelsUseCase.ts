import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAiModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AiModel[]> {
        return this.repository.listAiModels();
    }
}

export const ListAiModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAiModelsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
