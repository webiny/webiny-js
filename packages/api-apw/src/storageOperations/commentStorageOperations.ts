import { ApwStorageOperations } from "./types";
import { ApwCommentStorageOperations } from "./types";
import { baseFields, CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { getFieldValues, getTransformer } from "~/utils/fieldResolver";
import WebinyError from "@webiny/error";

export const createCommentStorageOperations = ({
    cms,
    getCmsContext
}: CreateApwStorageOperationsParams): ApwCommentStorageOperations => {
    const getCommentModel = async () => {
        const model = await cms.getModel("apwCommentModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwContentReviewModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getComment: ApwCommentStorageOperations["getComment"] = async ({ id }) => {
        const model = await getCommentModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues({
            entry,
            fields: baseFields,
            context: getCmsContext(),
            transformers: [getTransformer(model, "body")]
        });
    };
    return {
        getCommentModel,
        getComment,
        async listComments(params) {
            const model = await getCommentModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            const all = await Promise.all(
                entries.map(entry =>
                    getFieldValues({
                        entry,
                        fields: baseFields,
                        context: getCmsContext(),
                        transformers: [getTransformer(model, "body")]
                    })
                )
            );
            return [all, meta];
        },
        async createComment(this: ApwStorageOperations, params) {
            const model = await getCommentModel();
            const refModel = await this.getChangeRequestModel();
            const entry = await cms.createEntry(model, {
                ...params.data,
                changeRequest: {
                    ...params.data.changeRequest,
                    modelId: refModel.modelId
                }
            });

            return getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
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
            return getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
        },
        async deleteComment(params) {
            const model = await getCommentModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
