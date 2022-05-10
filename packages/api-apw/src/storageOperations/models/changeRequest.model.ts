import { createModelField } from "./utils";
import { WorkflowModelDefinition } from "~/types";

const bodyField = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "changeRequest"
    });

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "changeRequest"
    });

const resolvedField = () =>
    createModelField({
        label: "Resolved",
        type: "boolean",
        parent: "changeRequest"
    });

const mediaField = () =>
    createModelField({
        label: "Media",
        type: "file",
        parent: "changeRequest"
    });

const stepField = () =>
    createModelField({
        label: "Step",
        type: "text",
        parent: "changeRequest",
        validation: [
            {
                name: "required",
                message: "Value is required"
            }
        ]
    });

export const createChangeRequestModelDefinition = (): WorkflowModelDefinition => {
    return {
        name: "APW - Change Request",
        modelId: "apwChangeRequestModelDefinition",
        titleFieldId: "changeRequest_title",
        layout: [["changeRequest_body"], ["changeRequest_title"]],
        fields: [bodyField(), titleField(), resolvedField(), mediaField(), stepField()],
        description: ""
    };
};
