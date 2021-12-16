import { ApwContext, ApwWorkflowCrud } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export function createWorkflowMethods(context: ApwContext): ApwWorkflowCrud {
    return {
        async getModel(): Promise<CmsModel> {
            return await context.cms.getModel("apwWorkflowModelDefinition");
        },
        async get(id) {
            const model = await this.getModel();
            return await context.cms.getEntryById(model, id);
        },
        async list(params) {
            const model = await this.getModel();
            return await context.cms.listLatestEntries(model, params);
        },
        async create(data) {
            const model = await this.getModel();
            return await context.cms.createEntry(model, data);
        },
        async update(id, data) {
            const model = await this.getModel();
            const existingEntry = await this.get(id);

            return await context.cms.updateEntry(model, id, {
                ...existingEntry.values,
                ...data
            });
        },
        async delete(id: string) {
            const model = await this.getModel();
            await context.cms.deleteEntry(model, id);
            return true;
        }
    };
}
