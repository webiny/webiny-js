import { ApwStorageOperations } from "./types";
import { ApwCommentStorageOperations } from "./types";
import { baseFields, CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { getFieldValues, getTransformer } from "~/utils/fieldResolver";
import WebinyError from "@webiny/error";
import { ApwComment } from "~/types";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const pickIdFromChangeRequest = (obj: Record<string, any>): ApwComment => {
    const rawValue = obj["changeRequest"];
    if (!rawValue) {
        return obj as unknown as ApwComment;
    }
    obj["changeRequest"] = rawValue.id;
    return obj as unknown as ApwComment;
};

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
        getComment: async params => {
            const values = await getComment(params);
            return pickIdFromChangeRequest(values);
        },
        async listComments(params) {
            const model = await getCommentModel();
            const [entries, meta] = await cms.listLatestEntries(
                model,
                params as CmsEntryListParams
            );
            const values = await Promise.all(
                entries.map(entry =>
                    getFieldValues<ApwComment>({
                        entry,
                        fields: baseFields,
                        context: getCmsContext(),
                        transformers: [getTransformer(model, "body")]
                    })
                )
            );
            const all = values.map(value => pickIdFromChangeRequest(value));
            return [all, meta];
        },
        async createComment(this: ApwStorageOperations, params) {
            const model = await getCommentModel();
            const refModel = await this.getChangeRequestModel();
            const entry = await cms.createEntry(model, {
                ...params.data,
                changeRequest: {
                    id: params.data.changeRequest,
                    modelId: refModel.modelId
                }
            });

            const values = await getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
            return pickIdFromChangeRequest(values);
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
            const values = await getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
            return pickIdFromChangeRequest(values);
        },
        async deleteComment(params) {
            const model = await getCommentModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
