import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";
import { GetWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const result = await this.repository.get();
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (input.includeExpired) {
            return Result.ok(result.value);
        }
        return Result.ok({
            exclusions: filterActiveExclusions(result.value.exclusions, new Date())
        });
    }
}

export const GetWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
