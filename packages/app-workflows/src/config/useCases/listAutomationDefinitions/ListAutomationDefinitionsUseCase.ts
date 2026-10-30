import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAutomationDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AutomationDefinition[]> {
        return this.repository.listAutomationDefinitions();
    }
}

export const ListAutomationDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAutomationDefinitionsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
