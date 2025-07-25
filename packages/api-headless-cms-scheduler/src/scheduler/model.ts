import { createPrivateModelPlugin } from "@webiny/api-headless-cms/plugins/index.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

export const createSchedulerModel = () => {
    return createPrivateModelPlugin({
        noValidate: true,
        modelId: SCHEDULE_MODEL_ID,
        name: "Webiny CMS Schedule",
        fields: [
            {
                id: "targetId",
                fieldId: "targetId",
                storageId: "text@targetId",
                type: "text",
                label: "Target ID"
            },
            {
                id: "targetModelId",
                fieldId: "targetModelId",
                storageId: "text@targetModelId",
                type: "text",
                label: "Target Model ID"
            },
            {
                id: "scheduledBy",
                fieldId: "scheduledBy",
                storageId: "text@scheduledBy",
                type: "object",
                label: "Scheduled By",
                settings: {
                    fields: [
                        {
                            id: "id",
                            fieldId: "id",
                            storageId: "text@id",
                            type: "text",
                            label: "Identity ID"
                        },
                        {
                            id: "displayName",
                            fieldId: "displayName",
                            storageId: "text@displayName",
                            type: "text",
                            label: "Display Name"
                        },
                        {
                            id: "type",
                            fieldId: "type",
                            storageId: "text@type",
                            type: "text",
                            label: "Type"
                        }
                    ]
                }
            },
            {
                id: "scheduledOn",
                fieldId: "scheduledOn",
                storageId: "date@scheduledOn",
                type: "datetime",
                label: "Scheduled On"
            },
            {
                id: "dateOn",
                fieldId: "dateOn",
                storageId: "date@dateOn",
                type: "datetime",
                label: "Date On"
            },
            {
                id: "type",
                fieldId: "type",
                storageId: "text@type",
                type: "text",
                label: "Type"
            },
            {
                id: "title",
                fieldId: "title",
                storageId: "text@title",
                type: "text",
                label: "Title"
            },
            {
                id: "error",
                fieldId: "error",
                storageId: "text@error",
                type: "text",
                label: "Error"
            }
        ]
    });
};
