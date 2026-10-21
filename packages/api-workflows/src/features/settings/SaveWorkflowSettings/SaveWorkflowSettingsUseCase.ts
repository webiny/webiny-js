import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { SaveWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowSettingsValidator.validate(input);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        return this.repository.save(validation.value);
    }
}

export const SaveWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
