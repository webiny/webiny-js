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
                message: "`step` field value is required in changeRequest.",
                name: "required"
            }
        ]
    });

export const CHANGE_REQUEST_MODEL_ID = "apwChangeRequestModelDefinition";

export const createChangeRequestModelDefinition = (): WorkflowModelDefinition => {
    return {
        name: "APW - Change Request",
        modelId: CHANGE_REQUEST_MODEL_ID,
        titleFieldId: "changeRequest_title",
        layout: [["changeRequest_body"], ["changeRequest_title"]],
        fields: [bodyField(), titleField(), resolvedField(), mediaField(), stepField()],
        description: "",
        isPrivate: true
    };
};
