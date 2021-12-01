import { ApwContext } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export function createWorkflowMethods(context: ApwContext) {
    return {
        async getWorkflowModel(): Promise<CmsModel> {
            return await context.cms.getModel("apwWorkflowModelDefinition");
        },
        async getWorkflow(id) {
            const model = await this.getWorkflowModel();
            return await context.cms.getEntry(model, {
                where: {
                    id
                }
            });
        },
        async listWorkflows(params) {
            const model = await this.getWorkflowModel();
            return await context.cms.listEntries(model, params);
        },
        async createWorkflow(data) {
            const model = await this.getWorkflowModel();
            return await context.cms.createEntry(model, data);
        },
        async updateWorkflow(id, data) {
            const model = await this.getWorkflowModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getWorkflow(id);

            return await context.cms.updateEntry(model, id, {
                ...data,
                app: existingEntry.values.app
            });
        },
        async deleteWorkflow(id: string) {
            const model = await this.getWorkflowModel();
            await context.cms.deleteEntry(model, id);
            return true;
        }
    };
}
