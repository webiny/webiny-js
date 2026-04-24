import type { CmsModel } from "~/types";

export const createObjectMockModel = (): CmsModel => {
    return {
        tenant: "root",
        modelId: "objectModel",
        singularApiName: "ObjectModel",
        pluralApiName: "ObjectModels",
        name: "Object Model",
        titleFieldId: "titleFieldId",
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        createdBy: {
            type: "admin",
            displayName: "admin",
            id: "admin"
        },
        group: "group",
        description: "Object model for testing.",
        layout: [["titleId"], ["objectId"]],
        fields: [
            {
                fieldId: "textWithDefaultFieldId",
                id: "textWithDefaultId",
                label: "Text With Default",
                type: "text-with-default",
                storageId: "textWithDefaultStorageId",
                settings: {
                    defaultValue: "field with default value"
                },
                listValidation: [],
                validation: []
            },
            {
                fieldId: "titleFieldId",
                storageId: "titleStorageId",
                list: false,
                type: "text",
                id: "titleId",
                label: "Title",
                listValidation: [],
                validation: []
            },
            {
                id: "objectId",
                fieldId: "objectFieldId",
                storageId: "objectStorageId",
                label: "Object",
                type: "object",
                list: false,
                listValidation: [],
                validation: [],
                settings: {
                    fields: [
                        {
                            fieldId: "titleFieldId",
                            storageId: "titleStorageId",
                            list: false,
                            type: "text",
                            id: "titleId",
                            label: "Title",
                            listValidation: [],
                            validation: []
                        },
                        {
                            fieldId: "dateFieldId",
                            settings: {
                                type: "dateOnly"
                            },
                            storageId: "dateStorageId",
                            id: "dateId",
                            label: "Date",
                            type: "datetime",
                            listValidation: [],
                            validation: []
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
                            list: true,
                            listValidation: [],
                            validation: []
                        },
                        {
                            fieldId: "nestedTextWithDefaultFieldId",
                            id: "nestedTextWithDefaultId",
                            label: "Text With Default",
                            type: "text-with-default",
                            storageId: "nestedTextWithDefaultStorageId",
                            settings: {
                                defaultValue: "nested field with default value"
                            },
                            listValidation: [],
                            validation: []
                        }
                    ],
                    layout: [["titleId"], ["dateId"], ["dateMultipleId"]]
                }
            }
        ]
    };
};
