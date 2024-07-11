import {
    CmsGroup,
    createCmsGroupPlugin,
    createCmsModelPlugin,
    createPrivateModel
} from "@webiny/api-headless-cms";

export const createMockModels = () => {
    const group: CmsGroup = {
        id: "mockGroup",
        name: "Mock Group",
        icon: "fas/star",
        slug: "mock-group",
        description: "Mock Group Description"
    };
    return [
        createCmsGroupPlugin(group),
        createCmsModelPlugin({
            noValidate: true,
            modelId: "car",
            singularApiName: "Car",
            pluralApiName: "Cars",
            group: group,
            name: "Car",
            description: "Car model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        }),
        createCmsModelPlugin({
            noValidate: true,
            modelId: "author",
            singularApiName: "Author",
            pluralApiName: "Authors",
            group: group,
            name: "Author",
            description: "Author model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        })
    ];
};

export const createPrivateMockModels = () => {
    return [
        createCmsModelPlugin(
            createPrivateModel({
                modelId: "private-model",
                name: "Private Model",
                fields: [],
                titleFieldId: "title"
            })
        )
    ];
};
