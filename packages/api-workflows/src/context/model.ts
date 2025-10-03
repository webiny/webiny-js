import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

export const createWorkflowModel = () => {
    return createPrivateModelPlugin({
        modelId: WORKFLOW_MODEL_ID,
        name: "Workflow",
        fields: [
            {
                id: "name",
                type: "text",
                storageId: "text@name",
                fieldId: "name",
                label: "Name",
                validation: [
                    {
                        name: "required",
                        message: "Workflow name is required."
                    }
                ]
            },
            {
                id: "app",
                type: "text",
                storageId: "text@app",
                fieldId: "app",
                label: "App",
                validation: [
                    {
                        name: "required",
                        message: "App is required."
                    }
                ]
            },
            {
                id: "steps",
                type: "object",
                storageId: "object@steps",
                fieldId: "steps",
                label: "Steps",
                multipleValues: true,
                listValidation: [
                    {
                        name: "required",
                        message: "Steps are required."
                    },
                    {
                        name: "minLength",
                        settings: {
                            value: 1
                        },
                        message: "At least one step is required."
                    }
                ],
                settings: {
                    fields: [
                        {
                            id: "id",
                            type: "text",
                            fieldId: "id",
                            storageId: "text@id",
                            label: "Id",
                            validation: [
                                {
                                    name: "required",
                                    message: "Id is required."
                                }
                            ]
                        },
                        {
                            id: "title",
                            type: "text",
                            fieldId: "title",
                            storageId: "text@title",
                            label: "Title",
                            validation: [
                                {
                                    name: "required",
                                    message: "Title is required."
                                }
                            ]
                        },
                        {
                            id: "color",
                            type: "text",
                            fieldId: "color",
                            storageId: "text@color",
                            label: "Color",
                            validation: [
                                {
                                    name: "required",
                                    message: "Color is required."
                                }
                            ]
                        },
                        {
                            id: "description",
                            type: "text",
                            fieldId: "description",
                            storageId: "text@description",
                            label: "Description"
                        },
                        {
                            id: "teams",
                            type: "object",
                            fieldId: "teams",
                            storageId: "object@teams",
                            label: "Teams",
                            multipleValues: true,
                            listValidation: [
                                {
                                    name: "required",
                                    message: "At least one team is required."
                                },
                                {
                                    name: "minLength",
                                    settings: {
                                        value: 1
                                    },
                                    message: "At least one team is required."
                                }
                            ],
                            settings: {
                                fields: [
                                    {
                                        id: "id",
                                        type: "text",
                                        fieldId: "id",
                                        storageId: "text@id",
                                        label: "Id",
                                        validation: [
                                            {
                                                name: "required",
                                                message: "Id is required."
                                            }
                                        ]
                                    }
                                ]
                            },
                            validation: [
                                {
                                    name: "required",
                                    message: "At least one team is required."
                                }
                            ]
                        },
                        {
                            id: "notifications",
                            type: "object",
                            fieldId: "notifications",
                            storageId: "object@notifications",
                            label: "Notifications",
                            multipleValues: true,
                            settings: {
                                fields: [
                                    {
                                        id: "id",
                                        type: "text",
                                        fieldId: "id",
                                        storageId: "text@id",
                                        label: "Id",
                                        validation: [
                                            {
                                                name: "required",
                                                message: "Id is required."
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    });
};
