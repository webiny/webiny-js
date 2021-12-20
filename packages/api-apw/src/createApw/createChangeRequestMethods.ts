import { ApwChangeRequestCrud, CreateApwParams } from "~/types";

export function createChangeRequestMethods({
    storageOperations
}: CreateApwParams): ApwChangeRequestCrud {
    return {
        async getModel() {
            return await storageOperations.getModel("apwChangeRequestModelDefinition");
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
