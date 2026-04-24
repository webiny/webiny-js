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
    layout: [["name"]],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name",
            validation: [],
            listValidation: []
        }
    ]
};

export interface ICreateModelsPluginsParams {
    modifyModel?: (input: typeof model) => typeof model;
    modifyGroup?: (input: typeof group) => typeof group;
}

export const createModelsPlugins = (params?: ICreateModelsPluginsParams) => {
    if (!params) {
        return [createModelPlugin(model), createModelGroupPlugin(group)];
    }
    const modifiedModel = params.modifyModel ? params.modifyModel(model) : model;
    const modifiedGroup = params.modifyGroup ? params.modifyGroup(group) : group;

    const modelPlugin = createModelPlugin(modifiedModel);
    const groupPlugin = createModelGroupPlugin(modifiedGroup);
    return [modelPlugin, groupPlugin];
};
