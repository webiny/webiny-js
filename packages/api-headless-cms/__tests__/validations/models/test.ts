import { CmsApiModel } from "~/types";

export const createTestModel = (model: Partial<CmsApiModel> = {}): CmsApiModel => {
    return {
        modelId: "test",
        name: "Testing Model",
        singularApiName: "Test",
        pluralApiName: "Tests",
        description: "Testing model description",
        fields: [],
        layout: [],
        titleFieldId: "id",
        tenant: "root",
        locale: "en-US",
        group: {
            id: "group",
            name: "Group"
        },
        webinyVersion: "x.x.x",
        ...model
    };
};
