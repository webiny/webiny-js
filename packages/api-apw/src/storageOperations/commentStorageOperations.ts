import { ApwStorageOperations } from "./types";
import { ApwCommentStorageOperations } from "./types";
import { baseFields, CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { getFieldValues, getTransformer } from "~/utils/fieldResolver";
import WebinyError from "@webiny/error";
import { ApwComment } from "~/types";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { COMMENT_MODEL_ID } from "~/storageOperations/models/comment.model";

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
    getCmsContext,
    security
}: CreateApwStorageOperationsParams): ApwCommentStorageOperations => {
    const getCommentModel = async () => {
        security.disableAuthorization();
        const model = await cms.getModel(COMMENT_MODEL_ID);
        security.enableAuthorization();
        if (!model) {
            throw new WebinyError(
                `Could not find "${COMMENT_MODEL_ID}" model.`,
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getComment: ApwCommentStorageOperations["getComment"] = async ({ id }) => {
        const model = await getCommentModel();
        security.disableAuthorization();
        const entry = await cms.getEntryById(model, id);
        security.enableAuthorization();
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
            security.disableAuthorization();
            const [entries, meta] = await cms.listLatestEntries(
                model,
                params as CmsEntryListParams
            );
            security.enableAuthorization();
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
            security.disableAuthorization();
            const entry = await cms.createEntry(model, {
                ...params.data,
                changeRequest: {
                    id: params.data.changeRequest,
                    modelId: refModel.modelId
                }
            });
            security.enableAuthorization();

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

            security.disableAuthorization();
            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            security.enableAuthorization();
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
            security.disableAuthorization();
            await cms.deleteEntry(model, params.id);
            security.enableAuthorization();
            return true;
        }
    };
};
