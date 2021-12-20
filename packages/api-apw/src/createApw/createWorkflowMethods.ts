import { ApwWorkflowCrud, CreateApwParams } from "~/types";

export function createWorkflowMethods({ storageOperations }: CreateApwParams): ApwWorkflowCrud {
    return {
        async getModel() {
            return await storageOperations.getModel("apwWorkflowModelDefinition");
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
