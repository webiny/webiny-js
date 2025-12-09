import { ModelAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { DeleteWorkflow, ListWorkflows } from "../abstractions.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";

class DeleteWorkflowsOnModelAfterDeleteImpl implements ModelAfterDeleteHandler.Interface {
    constructor(
        private listWorkflows: ListWorkflows.Interface,
        private deleteWorkflow: DeleteWorkflow.Interface
    ) {}

    async handle(event: ModelAfterDeleteHandler.Event): Promise<void> {
        const { model } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });
        const workflows = await this.listWorkflows.execute({
            where: {
                app
            },
            limit: 10000
        });

        for (const workflow of workflows.items) {
            try {
                await this.deleteWorkflow.execute(workflow.app, workflow.id);
            } catch {
                // does not matter
            }
        }
    }
}

export const DeleteWorkflowsOnModelAfterDelete = ModelAfterDeleteHandler.createImplementation({
    implementation: DeleteWorkflowsOnModelAfterDeleteImpl,
    dependencies: [ListWorkflows, DeleteWorkflow]
});
