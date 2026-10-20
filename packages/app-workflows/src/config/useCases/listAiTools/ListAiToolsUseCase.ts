import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AiTool } from "~/editor/domain/types.js";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAiToolsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AiTool[]> {
        return this.repository.listAiTools();
    }
}

export const ListAiToolsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAiToolsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
