import { createCmsGroup, createCmsModel } from "@webiny/api-headless-cms";

export const accessTestGroup = createCmsGroup({
    id: "accessTestGroup",
    slug: "accessTestGroup",
    name: "Access Test Group",
    description: "",
    icon: "fa/fas"
});

export const accessTestModel = createCmsModel({
    name: "Access Test Model",
    modelId: "accessTestModel",
    description: "Used to test access",
    group: {
        id: accessTestGroup.contentModelGroup.id,
        name: accessTestGroup.contentModelGroup.name
    },
    fields: [
        {
            id: "title",
            storageId: "text@title",
            alias: "title",
            type: "text",
            label: "Title"
        }
    ],
    layout: [["title"]],
    titleFieldId: "title"
});
