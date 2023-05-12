import { CmsModel } from "~/types";

export const createObjectMockModel = (): CmsModel => {
    return {
        tenant: "root",
        locale: "en-US",
        modelId: "objectModel",
        name: "Object Model",
        titleFieldId: "titleFieldId",
        lockedFields: [],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        createdBy: {
            type: "admin",
            displayName: "admin",
            id: "admin"
        },
        webinyVersion: "w.w.w",

        group: {
            name: "Group",
            id: "group"
        },
        description: "Object model for testing.",
        layout: [["titleId"], ["objectId"]],
        fields: [
            {
                fieldId: "titleFieldId",
                storageId: "titleStorageId",
                multipleValues: false,
                type: "text",
                id: "titleId",
                label: "Title"
            },
            {
                id: "objectId",
                fieldId: "objectFieldId",
                storageId: "objectStorageId",
                label: "Object",
                type: "object",
                multipleValues: false,
                settings: {
                    fields: [
                        {
                            fieldId: "titleFieldId",
                            storageId: "titleStorageId",
                            multipleValues: false,
                            type: "text",
                            id: "titleId",
                            label: "Title"
                        },
                        {
                            fieldId: "dateFieldId",
                            settings: {
                                type: "dateOnly"
                            },
                            storageId: "dateStorageId",
                            id: "dateId",
                            label: "Date",
                            type: "datetime"
                        },
                        {
                            fieldId: "dateMultipleFieldId",
                            settings: {
                                type: "dateOnly"
                            },
                            storageId: "dateMultipleStorageId",
                            id: "dateMultipleId",
                            label: "Date Multiple",
                            type: "datetime",
                            multipleValues: true
                        }
                    ],
                    layout: [["titleId"], ["dateId"], ["dateMultipleId"]]
                }
            }
        ]
    };
};
