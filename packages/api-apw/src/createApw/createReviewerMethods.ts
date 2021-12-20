import { ApwReviewerCrud, CreateApwParams } from "~/types";

export function createReviewerMethods({ storageOperations }: CreateApwParams): ApwReviewerCrud {
    return {
        async getModel() {
            return await storageOperations.getModel("apwReviewerModelDefinition");
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
            return await storageOperations.createEntry(model, data);
        },
        async update(id, data) {
            const model = await this.getModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.get(id);

            return await storageOperations.updateEntry(model, id, {
                ...data,
                app: existingEntry.values.app
            });
        },
        async delete(id: string) {
            const model = await this.getModel();
            await storageOperations.deleteEntry(model, id);
            return true;
        }
    };
}
