import { createModelField } from "./utils";
import { WorkflowModelDefinition } from "~/types";

const idField = () =>
    createModelField({
        label: "Identity Id",
        type: "text",
        parent: "reviewer",
        validation: [{ message: "Value is required.", name: "required" }]
    });

const displayNameField = () =>
    createModelField({
        label: "Display Name",
        type: "text",
        parent: "reviewer",
        validation: [{ message: "Value is required.", name: "required" }]
    });

const typeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "reviewer",
        validation: [{ message: "Value is required.", name: "required" }]
    });

export const createReviewerModelDefinition = (): WorkflowModelDefinition => {
    return {
        name: "APW - Reviewer",
        modelId: "apwReviewerModelDefinition",
        titleFieldId: "displayName",
        layout: [["reviewer_id"], ["reviewer_displayName"]],
        fields: [idField(), displayNameField(), typeField()],
        description: ""
    };
};
