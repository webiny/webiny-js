import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

export const group = {
    id: "default",
    name: "Default",
    description: "",
    slug: "default",
    icon: {
        name: "fa/fas",
        type: "fa/fas"
    }
};

export const model = {
    modelId: "author",
    name: "Author",
    group: group.slug,
    titleFieldId: "name",
    description: "",
    icon: null,
    singularApiName: "Author",
    pluralApiName: "Authors",
    layout: [["name"], ["bio"]],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name",
            validation: [],
            listValidation: []
        },
        {
            id: "bio",
            storageId: "long-text@bio",
            fieldId: "bio",
            type: "long-text",
            label: "Bio",
            validation: [],
            listValidation: []
        }
    ]
};

/** The review namespace of the author model. */
export const AUTHOR_NAMESPACE = `cms.${model.modelId}`;

export const createModelPlugins = () => {
    return [createModelPlugin(model), createModelGroupPlugin(group)];
};
