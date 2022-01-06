import { ApwChangeRequestCrud, CreateApwParams } from "~/types";

export function createChangeRequestMethods({
    storageOperations
}: CreateApwParams): ApwChangeRequestCrud {
    return {
        async getModel() {
            return storageOperations.getChangeRequestModel();
        },
        async get(id) {
            return storageOperations.getChangeRequest({ id });
        },
        async list(params) {
            return storageOperations.listChangeRequests(params);
        },
        async create(data) {
            return storageOperations.createChangeRequest({ data });
        },
        async update(id, data) {
            return storageOperations.updateChangeRequest({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteChangeRequest({ id });
            return true;
        }
    };
}
