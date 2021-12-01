import { createModelField } from "../utils";

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

export const reviewerModelDefinition = {
    name: "APW - Reviewer",
    modelId: "apwReviewerModelDefinition",
    titleFieldId: "displayName",
    layout: [["reviewer_id"], ["reviewer_displayName"]],
    fields: [idField(), displayNameField()]
};
