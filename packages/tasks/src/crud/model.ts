import { createCmsModel, createPrivateModelDefinition } from "@webiny/api-headless-cms";
import { ITaskLogItemType, TaskDataStatus } from "~/types";

export const WEBINY_TASK_MODEL_ID = "webinyTask";
export const WEBINY_TASK_LOG_MODEL_ID = "webinyTaskLog";

const taskLogModelPlugin = createCmsModel(
    createPrivateModelDefinition({
        name: "Webiny Task Log",
        modelId: WEBINY_TASK_LOG_MODEL_ID,
        fields: [
            {
                id: "executionName",
                fieldId: "executionName",
                storageId: "text@executionName",
                type: "text",
                label: "Execution Name"
            },
            {
                id: "task",
                fieldId: "task",
                storageId: "text@task",
                type: "text",
                label: "Task",
                validation: [
                    {
                        name: "required",
                        message: "Task is required."
                    }
                ]
            },
            {
                id: "iteration",
                fieldId: "iteration",
                storageId: "number@iteration",
                type: "number",
                label: "Iteration",
                validation: [
                    {
                        name: "required",
                        message: "Iteration is required."
                    }
                ]
            },
            {
                id: "items",
                fieldId: "items",
                storageId: "object@items",
                type: "object",
                label: "Items",
                multipleValues: true,
                validation: [
                    {
                        name: "required",
                        message: "Items is required."
                    }
                ],
                settings: {
                    fields: [
                        {
                            id: "message",
                            fieldId: "message",
                            storageId: "text@message",
                            type: "text",
                            label: "Message",
                            validation: [
                                {
                                    name: "required",
                                    message: "Message is required."
                                }
                            ]
                        },
                        {
                            id: "createdOn",
                            fieldId: "createdOn",
                            storageId: "datetime@createdOn",
                            type: "datetime",
                            label: "Created On",
                            validation: [
                                {
                                    name: "required",
                                    message: "Created On is required."
                                }
                            ]
                        },
                        {
                            id: "type",
                            fieldId: "type",
                            storageId: "text@type",
                            type: "text",
                            label: "Type",
                            predefinedValues: {
                                enabled: true,
                                values: [
                                    {
                                        value: ITaskLogItemType.INFO,
                                        label: "Info"
                                    },
                                    {
                                        value: ITaskLogItemType.ERROR,
                                        label: "Error"
                                    }
                                ]
                            },
                            validation: [
                                {
                                    name: "required",
                                    message: "Type is required."
                                }
                            ]
                        },
                        {
                            id: "data",
                            fieldId: "data",
                            storageId: "object@data",
                            type: "json",
                            label: "Data"
                        },
                        {
                            id: "error",
                            fieldId: "error",
                            storageId: "object@error",
                            type: "json",
                            label: "Error"
                        }
                    ]
                }
            }
        ]
    })
);

const taskModelPlugin = createCmsModel(
    createPrivateModelDefinition({
        name: "Webiny Task",
        modelId: WEBINY_TASK_MODEL_ID,
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
                id: "parentId",
                fieldId: "parentId",
                storageId: "text@parentId",
                type: "text",
                label: "Parent ID"
            },
            {
                id: "executionName",
                fieldId: "executionName",
                storageId: "text@executionName",
                type: "text",
                label: "Execution Name"
            },
            {
                id: "iterations",
                fieldId: "iterations",
                storageId: "number@iterations",
                type: "number",
                label: "Iterations"
            },
            {
                id: "input",
                fieldId: "input",
                storageId: "object@input",
                type: "json",
                label: "Input"
            },
            {
                id: "output",
                fieldId: "output",
                storageId: "object@output",
                type: "json",
                label: "Output"
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
                        },
                        {
                            value: TaskDataStatus.ABORTED,
                            label: "Aborted"
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
                id: "eventResponse",
                fieldId: "eventResponse",
                storageId: "object@eventResponse",
                type: "json",
                label: "Event Response"
            }
        ]
    })
);

export const taskModel = taskModelPlugin.contentModel;
export const taskLogModel = taskLogModelPlugin.contentModel;

export const createTaskModel = () => {
    return [taskModelPlugin, taskLogModelPlugin];
};
