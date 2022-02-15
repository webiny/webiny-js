import { createModelField } from "./utils";
import { WorkflowModelDefinition } from "~/types";

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

interface CreateCommentModelDefinitionParams {
    modelId: string;
}
export const createCommentModelDefinition = ({
    modelId
}: CreateCommentModelDefinitionParams): WorkflowModelDefinition => {
    return {
        name: "APW - Comment",
        modelId: "apwCommentModelDefinition",
        titleFieldId: "displayName",
        layout: [["comment_body"], ["comment_displayName"]],
        fields: [commentBody(), changeRequestRef(modelId)]
    };
};
