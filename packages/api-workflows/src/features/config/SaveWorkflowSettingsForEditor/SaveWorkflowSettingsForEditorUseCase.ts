import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { SaveWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private saveSettings: SaveWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowSettingsPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "change the workflow settings" })
            );
        }

        return this.saveSettings.execute(input);
    }
}

export const SaveWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, SaveWorkflowSettingsUseCase]
});
