import { Result } from "@webiny/feature/api";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { SaveWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private saveSettings: SaveWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const access = await this.editorAccess.check("change the workflow settings");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        return this.saveSettings.execute(input);
    }
}

export const SaveWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [WorkflowEditorAccess, SaveWorkflowSettingsUseCase]
});
