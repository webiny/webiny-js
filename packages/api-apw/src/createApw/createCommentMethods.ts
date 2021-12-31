import { ApwCommentCrud, CreateApwParams } from "~/types";

export function createCommentMethods({ storageOperations }: CreateApwParams): ApwCommentCrud {
    return {
        async getModel() {
            return await storageOperations.getCommentModel();
        },
        async get(id) {
            return await storageOperations.getComment({ id });
        },
        async list(params) {
            return await storageOperations.listComments(params);
        },
        async create(data) {
            return await storageOperations.createComment({
                data
            });
        },
        async update(id, data) {
            return await storageOperations.updateComment({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteComment({ id });
            return true;
        }
    };
}
