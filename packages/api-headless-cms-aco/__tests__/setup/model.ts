import { CmsGroupPlugin, CmsModelPlugin } from "@webiny/api-headless-cms";

export const createGroupPlugin = () => {
    return new CmsGroupPlugin({
        name: "Group",
        slug: "group",
        description: "Group description",
        icon: "fas/star",
        id: "group"
    });
};

export const ACO_TEST_MODEL_ID = "testAcoModel";
export const createModelPlugin = () => {
    return new CmsModelPlugin({
        modelId: ACO_TEST_MODEL_ID,
        group: {
            id: "group",
            name: "Group"
        },

        name: "Test Aco Model Name",
        singularApiName: "TestAcoModel",
        pluralApiName: "TestAcoModels",
        fields: [
            {
                id: "title",
                type: "text",
                label: "Title",
                fieldId: "title"
            }
        ],
        layout: [["title"]],
        description: "",
        titleFieldId: "title"
    });
};
