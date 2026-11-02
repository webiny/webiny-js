import { Result } from "@webiny/feature/api";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { GetWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const access = await this.editorAccess.check("view the workflow settings");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        return this.getSettings.execute({ includeExpired: input.includeExpired === true });
    }
}

export const GetWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [WorkflowEditorAccess, GetWorkflowSettingsUseCase]
});
