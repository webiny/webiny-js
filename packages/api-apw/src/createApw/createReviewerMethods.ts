import { ApwContext, ApwReviewerCrud } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export function createReviewerMethods(context: ApwContext): ApwReviewerCrud {
    return {
        async getModel(): Promise<CmsModel> {
            return await context.cms.getModel("apwReviewerModelDefinition");
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
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.get(id);

            return await context.cms.updateEntry(model, id, {
                ...data,
                app: existingEntry.values.app
            });
        },
        async delete(id: string) {
            const model = await this.getModel();
            await context.cms.deleteEntry(model, id);
            return true;
        }
    };
}
