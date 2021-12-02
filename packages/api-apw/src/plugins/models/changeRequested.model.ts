import { createModelField } from "../utils";

const bodyField = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "changeRequested"
    });

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "changeRequested"
    });

const resolvedField = () =>
    createModelField({
        label: "Resolved",
        type: "boolean",
        parent: "changeRequested"
    });

const mediaField = () =>
    createModelField({
        label: "Media",
        type: "file",
        parent: "changeRequested"
    });

export const createChangeRequestedModelDefinition = () => ({
    name: "APW - Comment",
    modelId: "apwChangeRequestedModelDefinition",
    titleFieldId: "displayName",
    layout: [["changeRequested_body"], ["changeRequested_title"]],
    fields: [bodyField(), titleField(), resolvedField(), mediaField()]
});
