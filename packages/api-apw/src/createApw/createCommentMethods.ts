import { ApwCommentCrud, CreateApwParams } from "~/types";

export function createCommentMethods({ storageOperations }: CreateApwParams): ApwCommentCrud {
    return {
        async getModel() {
            return storageOperations.getCommentModel();
        },
        async get(id) {
            return storageOperations.getComment({ id });
        },
        async list(params) {
            return storageOperations.listComments(params);
        },
        async create(data) {
            return storageOperations.createComment({
                data
            });
        },
        async update(id, data) {
            return storageOperations.updateComment({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteComment({ id });
            return true;
        }
    };
}
