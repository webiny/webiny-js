import { ApwContext, ApwCommentCrud } from "~/types";

export function createCommentMethods(context: ApwContext): ApwCommentCrud {
    return {
        async getModel() {
            return await context.cms.getModel("apwContentReviewCommentModelDefinition");
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
            const refModel = await context.apw.changeRequest.getModel();

            return await context.cms.createEntry(model, {
                ...data,
                changeRequest: {
                    ...data.changeRequest,
                    modelId: refModel.modelId
                }
            });
        },
        async update(id, data) {
            const model = await this.getModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
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
