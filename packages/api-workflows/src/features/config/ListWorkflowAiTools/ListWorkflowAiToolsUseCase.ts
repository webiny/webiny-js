import { Result } from "@webiny/feature/api";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { ListWorkflowAiToolsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowAiToolsUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private tools: WorkflowAiToolRegistryService.Interface
    ) {}

    async execute(): UseCase.Return {
        const access = await this.editorAccess.check("list AI tools");
        if (access.isFail()) {
            return Result.fail(access.error);
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
    dependencies: [WorkflowEditorAccess, WorkflowAiToolRegistryService]
});
