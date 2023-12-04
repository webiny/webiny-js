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
            fields: [
                {
                    id: "name",
                    fieldId: "name",
                    type: "text",
                    label: "Name"
                },
                {
                    id: "input",
                    fieldId: "input",
                    type: "json",
                    label: "Input"
                },
                {
                    id: "running",
                    fieldId: "running",
                    type: "boolean",
                    label: "Running"
                },
                {
                    id: "startedOn",
                    fieldId: "startedOn",
                    type: "datetime",
                    label: "Started On"
                },
                {
                    id: "finishedOn",
                    fieldId: "finishedOn",
                    type: "datetime",
                    label: "Finished On"
                }
            ],
            layout: [],
            group: {
                id: "webinyTaskGroup",
                name: "Webiny Task Group"
            }
        })
    ];
};
