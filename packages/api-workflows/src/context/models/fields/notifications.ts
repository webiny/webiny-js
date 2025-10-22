import type { CmsModelObjectField } from "@webiny/api-headless-cms/types/index.js";

export const createNotificationsField = (): CmsModelObjectField => {
    return {
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
    };
}
