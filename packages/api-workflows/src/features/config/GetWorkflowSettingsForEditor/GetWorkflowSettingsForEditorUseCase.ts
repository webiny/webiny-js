import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { GetWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
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
                new WorkflowsNotAuthorizedError({ action: "view the workflow settings" })
            );
        }

        return this.getSettings.execute({ includeExpired: input.includeExpired === true });
    }
}

export const GetWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, GetWorkflowSettingsUseCase]
});
