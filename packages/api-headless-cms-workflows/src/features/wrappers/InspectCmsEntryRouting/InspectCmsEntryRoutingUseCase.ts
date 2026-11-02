import { Result } from "@webiny/feature/api";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { toCmsFolderType } from "~/utils/folderType.js";
import { InspectCmsEntryRoutingUseCase as UseCase } from "./abstractions.js";

/**
 * The folder type is derived from the model (`cms:<modelId>`, R121); the CMS folder port refuses a
 * folder of another type, which the engine reports as a routing failure.
 */
class InspectCmsEntryRoutingUseCaseImpl implements UseCase.Interface {
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

        const modelId = getModelIdFromAppName(input.model);
        if (!modelId) {
            return Result.fail(
                new WorkflowValidationError("Routing can only be inspected for a CMS model.")
            );
        }
        const folderId = input.folderId && input.folderId !== ROOT_FOLDER ? input.folderId : null;

        return this.inspectRouting.execute({
            stepConfig: input.stepConfig,
            model: input.model,
            requesterId: input.requesterId,
            folder: folderId ? { id: folderId, type: toCmsFolderType(modelId) } : null,
            now: new Date()
        });
    }
}

export const InspectCmsEntryRoutingUseCase = UseCase.createImplementation({
    implementation: InspectCmsEntryRoutingUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, InspectRoutingUseCase]
});
