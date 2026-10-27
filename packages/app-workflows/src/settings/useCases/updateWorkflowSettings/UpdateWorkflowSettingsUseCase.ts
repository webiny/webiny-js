import type { WorkflowSettings } from "~/settings/domain/types.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class UpdateWorkflowSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    public async execute(params: UseCaseAbstraction.Params): Promise<WorkflowSettings> {
        return this.repository.updateSettings(params);
    }
}

export const UpdateWorkflowSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
