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

const stepField = () =>
    createModelField({
        label: "Step",
        type: "text",
        parent: "comment",
        validation: [
            {
                name: "required",
                message: "Value is required"
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

export const createCommentModelDefinition = ({
    modelId
}: CreateCommentModelDefinitionParams): WorkflowModelDefinition => {
    return {
        name: "APW - Comment",
        modelId: "apwCommentModelDefinition",
        titleFieldId: "displayName",
        layout: [["comment_body"], ["comment_displayName"]],
        fields: [commentBody(), changeRequestRef(modelId), stepField(), mediaField()],
        description: ""
    };
};
