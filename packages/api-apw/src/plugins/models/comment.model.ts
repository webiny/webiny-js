import { createModelField } from "../utils";

const commentBody = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "comment"
    });

const changeRequestRef = modelId =>
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

export const createCommentModelDefinition = ({ modelId }) => ({
    name: "APW - Comment",
    modelId: "apwContentReviewCommentModelDefinition",
    titleFieldId: "displayName",
    layout: [["comment_body"], ["comment_displayName"]],
    fields: [commentBody(), changeRequestRef(modelId)]
});
