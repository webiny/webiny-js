import { Result } from "@webiny/feature/api";
import type { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

/**
 * Settings with the given exclusions, expired ones included (the caller filters). Records every
 * input and fails the next `failuresLeft` calls. Register with
 * `container.registerInstance(GetWorkflowSettingsUseCase, fake)`.
 */
export class FakeWorkflowSettings implements GetWorkflowSettingsUseCase.Interface {
    public exclusions: WorkflowExclusion[] = [];
    public readonly inputs: GetWorkflowSettingsUseCase.Input[] = [];
    public failuresLeft = 0;

    public async execute(
        input: GetWorkflowSettingsUseCase.Input = {}
    ): GetWorkflowSettingsUseCase.Return {
        this.inputs.push({ ...input });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(
                new WorkflowSettingsPersistenceError(new Error("Storage is not available."))
            );
        }
        return Result.ok({ exclusions: structuredClone(this.exclusions) });
    }
}
