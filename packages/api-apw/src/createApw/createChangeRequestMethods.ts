import { ApwChangeRequestCrud, CreateApwParams } from "~/types";

export function createChangeRequestMethods({
    storageOperations
}: CreateApwParams): ApwChangeRequestCrud {
    return {
        async getModel() {
            return await storageOperations.getChangeRequestModel();
        },
        async get(id) {
            return await storageOperations.getChangeRequest({ id });
        },
        async list(params) {
            return await storageOperations.listChangeRequests(params);
        },
        async create(data) {
            return await storageOperations.createChangeRequest({ data });
        },
        async update(id, data) {
            return await storageOperations.updateChangeRequest({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteChangeRequest({ id });
            return true;
        }
    };
}
