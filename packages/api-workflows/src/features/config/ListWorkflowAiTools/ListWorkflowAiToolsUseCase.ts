import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowAiToolsUseCase as UseCase } from "./abstractions.js";

const FAILURE_MESSAGE = "Could not list the AI tools.";
const FAILURE_LOG = "Could not list the workflow AI tools.";

class ListWorkflowAiToolsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private tools: WorkflowAiToolRegistryService.Interface,
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
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list AI tools" }));
        }

        let rows: WorkflowAiToolInfo[];
        try {
            rows = this.tools.list().map(tool => {
                return {
                    name: tool.name,
                    title: tool.title,
                    description: tool.description,
                    changesContent: tool.changesContent ?? false
                };
            });
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));
        return Result.ok(rows);
    }
}

export const ListWorkflowAiToolsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowAiToolsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WorkflowAiToolRegistryService, Logger]
});
