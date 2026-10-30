import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import type { ConfiguredAiModel } from "~/api/features/ConfiguredAiModels/index.js";
import { ListWorkflowAiModelsUseCase as UseCase } from "./abstractions.js";

const LIST_FAILED = "Could not list the AI models.";

class ListWorkflowAiModelsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private models: ConfiguredAiModelsService.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            // Nobody else logs a throwing permission read: log the raw error, show a fixed text.
            this.logger.error({ error }, LIST_FAILED);
            return Result.fail(new WorkflowPersistenceError(new Error(LIST_FAILED)));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list AI models" }));
        }

        // `list()` logs its own failure once and returns a failed Result with a fixed text: this
        // use case shows that text and does not log it again. A throw is not expected from the
        // service; nobody logged it, so it is logged here with the raw error and shown as a fixed
        // text (R87).
        let listed: Result<ConfiguredAiModel[], Error>;
        try {
            listed = await this.models.list();
        } catch (error) {
            this.logger.error({ error }, LIST_FAILED);
            return Result.fail(new WorkflowPersistenceError(new Error(LIST_FAILED)));
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listed.error));
        }

        return Result.ok(
            listed.value.map(model => {
                return {
                    id: model.id,
                    name: model.name,
                    providerId: model.providerId,
                    providerName: model.providerName
                };
            })
        );
    }
}

export const ListWorkflowAiModelsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowAiModelsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, ConfiguredAiModelsService, Logger]
});
