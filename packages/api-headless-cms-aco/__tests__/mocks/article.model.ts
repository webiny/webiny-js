import { createCmsModel } from "@webiny/api-headless-cms";

export const createArticleModel = () => {
    return createCmsModel({
        modelId: "article",
        singularApiName: "Article",
        pluralApiName: "Articles",
        name: "Article",
        description: "Article model",
        fields: [
            {
                id: "title",
                fieldId: "title",
                type: "text",
                label: "Title"
            },
            {
                id: "smallText",
                fieldId: "smallText",
                type: "long-text",
                label: "Small Text"
            },
            {
                id: "bigText",
                fieldId: "bigText",
                type: "rich-text",
                label: "Big Text"
            },
            {
                id: "photo",
                fieldId: "photo",
                type: "file",
                label: "Photo",
                settings: {
                    imagesOnly: true
                }
            }
        ],
        layout: [["title", "smallText", "bigText", "photo"]],
        group: {
            id: "group",
            name: "Group"
        },
        titleFieldId: "title",
        descriptionFieldId: "smallText",
        imageFieldId: "photo"
    });
};
