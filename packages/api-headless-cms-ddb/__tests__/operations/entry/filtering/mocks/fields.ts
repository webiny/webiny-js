import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFields as baseCreateFields } from "~/operations/entry/filtering/createFields";
import { PluginsContainer } from "@webiny/plugins";

export const createModel = (): CmsModel => {
    return {
        modelId: "testModel",
        name: "Test Model",
        fields: [
            {
                id: "age",
                type: "number",
                fieldId: "age",
                storageId: "age",
                label: "Age"
            },
            {
                id: "title",
                type: "text",
                fieldId: "title",
                storageId: "title",
                label: "Title"
            },
            {
                id: "date",
                type: "datetime",
                fieldId: "date",
                storageId: "date",
                label: "Date"
            },
            {
                id: "isMarried",
                type: "boolean",
                fieldId: "isMarried",
                storageId: "isMarried",
                label: "Is Married"
            },
            {
                id: "price",
                type: "number",
                fieldId: "price",
                storageId: "price",
                label: "Price"
            },
            {
                id: "availableOn",
                type: "datetime",
                fieldId: "availableOn",
                storageId: "availableOn",
                label: "Available On"
            }
        ],
        layout: [],
        locale: "en-US",
        tenant: "root",
        description: "",
        group: {
            id: "group",
            name: "Group"
        },
        titleFieldId: "title",
        webinyVersion: "x.x.x"
    };
};

interface Params {
    plugins: PluginsContainer;
}
export const createFields = (params: Params) => {
    return baseCreateFields({
        ...params,
        fields: createModel().fields
    });
};
