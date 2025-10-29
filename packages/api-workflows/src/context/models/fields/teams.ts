import type { CmsModelObjectField } from "@webiny/api-headless-cms/types/index.js";

export const createTeamsField = (): CmsModelObjectField => {
    return {
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
    };
};
