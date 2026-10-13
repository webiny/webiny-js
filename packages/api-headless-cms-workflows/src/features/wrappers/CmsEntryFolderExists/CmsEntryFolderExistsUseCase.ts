import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";
import { CmsEntryFolderExistsUseCase as UseCase } from "./abstractions.js";

class CmsEntryFolderExistsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private folders: CmsEntryFolderExistsService.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "check folders" }));
        }

        try {
            return Result.ok(await this.folders.exists({ id: input.id, type: input.type }));
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
    }
}

export const CmsEntryFolderExistsUseCase = UseCase.createImplementation({
    implementation: CmsEntryFolderExistsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, CmsEntryFolderExistsService]
});
