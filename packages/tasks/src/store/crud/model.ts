import { createCmsGroup, createCmsModel } from "@webiny/api-headless-cms";

export const createTaskModel = () => {
    return [
        createCmsGroup({
            id: "webinyTaskGroup",
            isPrivate: true,
            name: "Webiny Task Group",
            slug: "webiny-task-group",
            icon: "",
            description: ""
        }),
        createCmsModel({
            modelId: "webinyTask",
            isPrivate: true,
            description: "",
            name: "Webiny Task",
            titleFieldId: "name",
            fields: [],
            layout: [],
            group: {
                id: "webinyTaskGroup",
                name: "Webiny Task Group"
            }
        })
    ];
};
