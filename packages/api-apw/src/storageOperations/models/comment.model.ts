import { createPrivateModel } from "@webiny/api-headless-cms";
import { createModelField } from "./utils";

const commentBody = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "comment"
    });

const changeRequestRef = (modelId: string) =>
    createModelField({
        label: "Change Request",
        type: "ref",
        parent: "comment",
        settings: {
            models: [
                {
                    modelId
                }
            ]
        }
    });

const stepField = () =>
    createModelField({
        label: "Step",
        type: "text",
        parent: "comment",
        validation: [
            {
                message: "`step` field value is required in comment.",
                name: "required"
            }
        ]
    });

const mediaField = () =>
    createModelField({
        label: "Media",
        type: "file",
        parent: "comment"
    });

interface CreateCommentModelDefinitionParams {
    modelId: string;
}

export const COMMENT_MODEL_ID = "apwCommentModelDefinition";

export const createCommentModel = ({ modelId }: CreateCommentModelDefinitionParams) => {
    return createPrivateModel({
        name: "APW - Comment",
        modelId: COMMENT_MODEL_ID,
        titleFieldId: "step",
        fields: [commentBody(), changeRequestRef(modelId), stepField(), mediaField()]
    });
};
