import { CmsModel } from "@webiny/api-headless-cms/types";

export const createMockTargetModel = (): CmsModel => {
    return {
        modelId: "targetModel",
        name: "Target Model",
        description: "This is a mock target model for testing purposes.",
        fields: [
            {
                id: "title",
                fieldId: "title",
                storageId: "text@title",
                type: "text",
                label: "Title"
            }
        ],
        group: {
            id: "default",
            name: "Default Group"
        },
        singularApiName: "targetModel",
        pluralApiName: "targetModels",
        layout: [],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        webinyVersion: "0.0.0",
        tenant: "root",
        locale: "en-US",
        titleFieldId: "title"
    };
};
