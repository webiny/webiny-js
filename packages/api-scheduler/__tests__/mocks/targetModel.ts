import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsModel } from "@webiny/api-headless-cms/types";

const group = {
    id: "default",
    name: "Default Group"
};

export const MOCK_TARGET_MODEL_ID = "targetModel";

export const createMockTargetModel = (): CmsModel => {
    return {
        modelId: MOCK_TARGET_MODEL_ID,
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
        group,
        singularApiName: "targetModel",
        pluralApiName: "targetModels",
        layout: [["title"]],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        webinyVersion: "0.0.0",
        tenant: "root",
        locale: "en-US",
        titleFieldId: "title"
    };
};

export const createMockTargetModelPlugins = () => {
    return [
        createModelGroupPlugin({
            ...group,
            slug: "default",
            description: null,
            icon: "fa/fas"
        }),
        createModelPlugin({
            ...createMockTargetModel(),
            isPrivate: undefined
        })
    ];
};
