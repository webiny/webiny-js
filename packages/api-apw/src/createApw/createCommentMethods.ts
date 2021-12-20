import { ApwChangeRequestCrud, ApwCommentCrud, CreateApwParams } from "~/types";

interface CreateCommentMethodsParams extends CreateApwParams {
    getChangeRequestModel: ApwChangeRequestCrud["getModel"];
}

export function createCommentMethods({
    storageOperations,
    getChangeRequestModel
}: CreateCommentMethodsParams): ApwCommentCrud {
    return {
        async getModel() {
            return await storageOperations.getModel("apwContentReviewCommentModelDefinition");
        },
        async get(id) {
            const model = await this.getModel();
            return await storageOperations.getEntryById(model, id);
        },
        async list(params) {
            const model = await this.getModel();
            return await storageOperations.listLatestEntries(model, params);
        },
        async create(data) {
            const model = await this.getModel();
            const refModel = await getChangeRequestModel();

            return await storageOperations.createEntry(model, {
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

            return await storageOperations.updateEntry(model, id, {
                ...existingEntry.values,
                ...data
            });
        },
        async delete(id: string) {
            const model = await this.getModel();
            await storageOperations.deleteEntry(model, id);
            return true;
        }
    };
}
