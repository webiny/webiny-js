import { ModelAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";

class DeleteWorkflowsOnModelAfterDeleteImpl implements ModelAfterDeleteHandler.Interface {
    constructor(
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private deleteWorkflow: DeleteWorkflowUseCase.Interface
    ) {}

    async handle(event: ModelAfterDeleteHandler.Event): Promise<void> {
        const { model } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });
        const result = await this.listWorkflows.execute({
            where: {
                app
            },
            limit: 10000
        });

        const workflows = result.value.items;

        for (const workflow of workflows) {
            try {
                await this.deleteWorkflow.execute({
                    app: workflow.app,
                    id: workflow.id
                });
            } catch {
                // does not matter
            }
        }
    }
}

export const DeleteWorkflowsOnModelAfterDelete = ModelAfterDeleteHandler.createImplementation({
    implementation: DeleteWorkflowsOnModelAfterDeleteImpl,
    dependencies: [ListWorkflowsUseCase, DeleteWorkflowUseCase]
});
