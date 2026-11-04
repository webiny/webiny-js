import { Result } from "@webiny/feature/api";
import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { WB_PAGE_FOLDER_TYPE, WB_PAGE_NAMESPACE } from "~/constants.js";
import { InspectWebsiteBuilderPageRoutingUseCase as UseCase } from "./abstractions.js";

/**
 * The folder type is always `wb:page` (R121); the WB folder port refuses a folder of another
 * type, which the engine reports as a routing failure.
 */
class InspectWebsiteBuilderPageRoutingUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private inspectRouting: InspectRoutingUseCase.Interface
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
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "inspect routing" }));
        }

        const folderId = input.folderId && input.folderId !== ROOT_FOLDER ? input.folderId : null;

        return this.inspectRouting.execute({
            stepConfig: input.stepConfig,
            model: WB_PAGE_NAMESPACE,
            requesterId: input.requesterId,
            folder: folderId ? { id: folderId, type: WB_PAGE_FOLDER_TYPE } : null,
            now: new Date()
        });
    }
}

export const InspectWebsiteBuilderPageRoutingUseCase = UseCase.createImplementation({
    implementation: InspectWebsiteBuilderPageRoutingUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, InspectRoutingUseCase]
});
