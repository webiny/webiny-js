import { ApwChangeRequestStorageOperations, ApwCommentStorageOperations } from "~/types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";

export const createCommentStorageOperations = ({
    cms,
    getChangeRequestModel
}: CreateApwStorageOperationsParams & {
    getChangeRequestModel: ApwChangeRequestStorageOperations["getChangeRequestModel"];
}): ApwCommentStorageOperations => {
    const getCommentModel = () => {
        return cms.getModel("apwCommentModelDefinition");
    };
    const getComment: ApwCommentStorageOperations["getComment"] = async ({ id }) => {
        const model = await getCommentModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues(entry, baseFields);
    };
    return {
        getCommentModel,
        getComment,
        async listComments(params) {
            const model = await getCommentModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            const all = await Promise.all(entries.map(entry => getFieldValues(entry, baseFields)));
            return [all, meta];
        },
        async createComment(params) {
            const model = await getCommentModel();
            const refModel = await getChangeRequestModel();
            const entry = await cms.createEntry(model, {
                ...params.data,
                changeRequest: {
                    ...params.data.changeRequest,
                    modelId: refModel.modelId
                }
            });

            return getFieldValues(entry, baseFields);
        },
        async updateComment(params) {
            const model = await getCommentModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getComment({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteComment(params) {
            const model = await getCommentModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
