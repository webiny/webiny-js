import { CmsGroup, createCmsGroup, createCmsModel } from "@webiny/api-headless-cms";
import { TaskDataStatus } from "~/types";

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
            label: "Name",
            validation: [
                {
                    name: "required",
                    message: "Name is required."
                }
            ]
        },
        {
            id: "definitionId",
            fieldId: "definitionId",
            storageId: "text@definitionId",
            type: "text",
            label: "Definition ID",
            validation: [
                {
                    name: "required",
                    message: "Definition ID is required."
                }
            ]
        },
        {
            id: "values",
            fieldId: "values",
            storageId: "object@values",
            type: "json",
            label: "Values"
        },
        {
            id: "taskStatus",
            fieldId: "taskStatus",
            storageId: "text@taskStatus",
            type: "text",
            label: "Status",
            predefinedValues: {
                enabled: true,
                values: [
                    {
                        value: TaskDataStatus.PENDING,
                        label: "Pending"
                    },
                    {
                        value: TaskDataStatus.RUNNING,
                        label: "Running"
                    },
                    {
                        value: TaskDataStatus.FAILED,
                        label: "Failed"
                    },
                    {
                        value: TaskDataStatus.SUCCESS,
                        label: "Success"
                    }
                ]
            },
            settings: {
                defaultValue: TaskDataStatus.PENDING
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
        },
        {
            id: "eventResponse",
            fieldId: "eventResponse",
            storageId: "object@eventResponse",
            type: "json",
            label: "Event Response"
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
