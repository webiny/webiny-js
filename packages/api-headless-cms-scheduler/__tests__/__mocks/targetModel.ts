import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsModel } from "@webiny/api-headless-cms/types";

const group = {
    id: "default",
    name: "Default Group"
};

export const MOCK_TARGET_MODEL_ID = "targetModel";

export const createMockTargetModel = (): CmsModel => {
    return {
        icon: {
            name: "fa/fas",
            type: "font-awesome"
        },
        modelId: MOCK_TARGET_MODEL_ID,
        name: "Target Model",
        description: "This is a mock target model for testing purposes.",
        fields: [
            {
                id: "title",
                fieldId: "title",
                storageId: "text@title",
                type: "text",
                label: "Title",
                validation: [],
                listValidation: []
            }
        ],
        group: group.id,
        singularApiName: "targetModel",
        pluralApiName: "targetModels",
        layout: [["title"]],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        tenant: "root",
        titleFieldId: "title"
    };
};

export const createMockTargetModelPlugins = () => {
    return [
        createModelGroupPlugin({
            ...group,
            slug: "default",
            description: null,
            icon: {
                name: "fa/fas",
                type: "font-awesome"
            }
        }),
        createModelPlugin({
            ...createMockTargetModel(),
            isPrivate: undefined
        })
    ];
};
