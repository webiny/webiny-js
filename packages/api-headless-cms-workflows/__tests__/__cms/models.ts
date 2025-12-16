import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

export const groupPlugin = createModelGroupPlugin({
    id: "default",
    name: "Default",
    description: "",
    slug: "default",
    icon: "fa/fas"
});

export const group = groupPlugin.contentModelGroup;

export const modelPlugin = createModelPlugin({
    modelId: "author",
    name: "Author",
    group: {
        id: group.id,
        name: group.name
    },
    titleFieldId: "name",
    description: "",
    singularApiName: "Author",
    pluralApiName: "Authors",
    layout: [["name"]],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name"
        }
    ]
});

export const model = modelPlugin.contentModel;

export const createModelsPlugins = () => {
    return [modelPlugin, groupPlugin];
};
