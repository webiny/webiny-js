import { createModelField } from "../utils";

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

export const createChangeRequestModelDefinition = () => ({
    name: "APW - Change Request",
    modelId: "apwChangeRequestModelDefinition",
    titleFieldId: "changeRequest_title",
    layout: [["changeRequest_body"], ["changeRequest_title"]],
    fields: [bodyField(), titleField(), resolvedField(), mediaField()]
});
