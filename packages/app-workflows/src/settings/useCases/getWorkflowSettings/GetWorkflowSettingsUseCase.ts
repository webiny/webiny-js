import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetWorkflowSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    public async execute(): Promise<WorkflowSettings> {
        const params: GetSettingsParams = { includeExpired: true };
        return this.repository.getSettings(params);
    }
}

export const GetWorkflowSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
