import { createPrivateModelDefinition } from "@webiny/api-headless-cms";
import { createModelField } from "./utils";

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

export const createChangeRequestModelDefinition = () => {
    return createPrivateModelDefinition({
        name: "APW - Change Request",
        modelId: CHANGE_REQUEST_MODEL_ID,
        titleFieldId: "title",
        fields: [bodyField(), titleField(), resolvedField(), mediaField(), stepField()]
    });
};
