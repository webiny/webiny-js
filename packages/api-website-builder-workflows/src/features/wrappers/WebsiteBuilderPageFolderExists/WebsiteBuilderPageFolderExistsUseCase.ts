import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";
import { WebsiteBuilderPageFolderExistsUseCase as UseCase } from "./abstractions.js";

class WebsiteBuilderPageFolderExistsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private folders: WbPageFolderExistsService.Interface
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
            return Result.ok(await this.folders.exists(input.id));
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
    }
}

export const WebsiteBuilderPageFolderExistsUseCase = UseCase.createImplementation({
    implementation: WebsiteBuilderPageFolderExistsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WbPageFolderExistsService]
});
