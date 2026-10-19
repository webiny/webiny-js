import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowAiToolsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowAiToolsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private tools: WorkflowAiToolRegistryService.Interface
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
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
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
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));
        return Result.ok(rows);
    }
}

export const ListWorkflowAiToolsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowAiToolsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WorkflowAiToolRegistryService]
});
