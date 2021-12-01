import { createModelField } from "../utils";

const commentBody = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "comment"
    });

export const commentModelDefinition = () => ({
    name: "APW - Comment",
    modelId: "apwContentReviewCommentModelDefinition",
    titleFieldId: "displayName",
    layout: [["comment_body"], ["comment_displayName"]],
    fields: [commentBody()]
});
