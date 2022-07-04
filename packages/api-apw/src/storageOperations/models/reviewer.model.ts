import { createModelField } from "./utils";
import { WorkflowModelDefinition } from "~/types";

const idField = () =>
    createModelField({
        label: "Identity Id",
        type: "text",
        parent: "reviewer",
        validation: [
            {
                message: "`identityId` field value is required in reviewer.",
                name: "required"
            }
        ]
    });

const displayNameField = () =>
    createModelField({
        label: "Display Name",
        type: "text",
        parent: "reviewer",
        validation: [
            {
                message: "`displayName` field value is required in reviewer.",
                name: "required"
            }
        ]
    });

const typeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "reviewer",
        validation: [
            {
                message: "`type` field value is required in reviewer.",
                name: "required"
            }
        ]
    });

export const REVIEWER_MODEL_ID = "apwReviewerModelDefinition";

export const createReviewerModelDefinition = (): WorkflowModelDefinition => {
    return {
        name: "APW - Reviewer",
        modelId: REVIEWER_MODEL_ID,
        titleFieldId: "displayName",
        layout: [["reviewer_id"], ["reviewer_displayName"]],
        fields: [idField(), displayNameField(), typeField()],
        description: "",
        isPrivate: true
    };
};
