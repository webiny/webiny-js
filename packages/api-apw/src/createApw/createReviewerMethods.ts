import { ApwReviewerCrud, CreateApwParams } from "~/types";

export function createReviewerMethods({ storageOperations }: CreateApwParams): ApwReviewerCrud {
    return {
        async getModel() {
            return await storageOperations.getReviewerModel();
        },
        async get(id) {
            return await storageOperations.getReviewer({ id });
        },
        async list(params) {
            return await storageOperations.listReviewers(params);
        },
        async create(data) {
            return await storageOperations.createReviewer({ data });
        },
        async update(id, data) {
            return await storageOperations.updateReviewer({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteReviewer({ id });
            return true;
        }
    };
}
