import type { WorkflowSettings } from "~/settings/domain/types.js";
import { GetWorkflowSettingsUseCase } from "./getWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./updateWorkflowSettings/abstractions.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * A temporary delegate over the two settings use cases (R356): it keeps the presenters that still
 * inject the bundle working until they inject the use cases themselves. Task 14 deletes it.
 */
class WorkflowSettingsUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(
        private getWorkflowSettingsUseCase: GetWorkflowSettingsUseCase.Interface,
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface
    ) {}

    public async getSettings(): Promise<WorkflowSettings> {
        return this.getWorkflowSettingsUseCase.execute();
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        return this.updateWorkflowSettingsUseCase.execute(settings);
    }
}

export const WorkflowSettingsUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowSettingsUseCasesImpl,
    dependencies: [GetWorkflowSettingsUseCase, UpdateWorkflowSettingsUseCase]
});
