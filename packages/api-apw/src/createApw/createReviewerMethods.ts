import { ApwReviewerCrud, CreateApwParams } from "~/types";

export function createReviewerMethods({ storageOperations }: CreateApwParams): ApwReviewerCrud {
    return {
        async getModel() {
            return storageOperations.getReviewerModel();
        },
        async get(id) {
            return storageOperations.getReviewer({ id });
        },
        async list(params) {
            return storageOperations.listReviewers(params);
        },
        async create(data) {
            return storageOperations.createReviewer({ data });
        },
        async update(id, data) {
            return storageOperations.updateReviewer({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteReviewer({ id });
            return true;
        }
    };
}
