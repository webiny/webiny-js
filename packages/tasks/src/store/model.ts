import { CmsGroup, createCmsGroup, createCmsModel } from "@webiny/api-headless-cms";

export const WEBINY_TASK_MODEL_ID = "webinyTask";

const group: CmsGroup = {
    id: "webinyTaskGroup",
    isPrivate: true,
    name: "Webiny Task Group",
    slug: "webiny-task-group",
    icon: "",
    description: ""
};
const modelPlugin = createCmsModel({
    modelId: WEBINY_TASK_MODEL_ID,
    isPrivate: true,
    noValidate: true,
    description: "",
    name: "Webiny Task",
    titleFieldId: "name",
    fields: [
        {
            id: "name",
            fieldId: "name",
            storageId: "text@name",
            type: "text",
            label: "Name"
        },
        {
            id: "input",
            fieldId: "input",
            storageId: "object@input",
            type: "json",
            label: "Input"
        },
        {
            id: "status",
            fieldId: "status",
            storageId: "text@status",
            type: "text",
            label: "Status",
            predefinedValues: {
                enabled: true,
                values: [
                    {
                        value: "pending",
                        label: "Pending"
                    },
                    {
                        value: "running",
                        label: "Running"
                    },
                    {
                        value: "failed",
                        label: "Failed"
                    },
                    {
                        value: "success",
                        label: "Success"
                    }
                ]
            }
        },
        {
            id: "startedOn",
            fieldId: "startedOn",
            storageId: "datetime@startedOn",
            type: "datetime",
            label: "Started On"
        },
        {
            id: "finishedOn",
            fieldId: "finishedOn",
            storageId: "datetime@finishedOn",
            type: "datetime",
            label: "Finished On"
        },
        {
            id: "log",
            fieldId: "log",
            storageId: "object@log",
            type: "json",
            label: "Log",
            multipleValues: true
        }
    ],
    layout: [],
    group: {
        id: "webinyTaskGroup",
        name: "Webiny Task Group"
    }
});
export const model = modelPlugin.contentModel;

export const createTaskModel = () => {
    return [createCmsGroup(group), modelPlugin];
};
