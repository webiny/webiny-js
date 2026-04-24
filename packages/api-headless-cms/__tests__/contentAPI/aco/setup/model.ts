import { CmsGroupPlugin, CmsModelPlugin, createModelField } from "~/index";
import { createIcon } from "~tests/__helpers/icon.js";

export const createGroupPlugin = () => {
    return new CmsGroupPlugin({
        name: "Group",
        slug: "group",
        description: "Group description",
        icon: createIcon("fas/star"),
        id: "group"
    });
};

export const ACO_TEST_MODEL_ID = "testAcoModel";
export const createModelPlugin = () => {
    return new CmsModelPlugin({
        modelId: ACO_TEST_MODEL_ID,
        group: "group",
        name: "Test Aco Model Name",
        singularApiName: "TestAcoModel",
        pluralApiName: "TestAcoModels",
        icon: null,
        fields: [
            createModelField({
                id: "title",
                type: "text",
                label: "Title",
                fieldId: "title"
            })
        ],
        layout: [["title"]],
        description: "",
        titleFieldId: "title"
    });
};
