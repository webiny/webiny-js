import { createPrivateModel } from "@webiny/api-headless-cms";

export const translatableCollectionModel = createPrivateModel({
    name: "Translatable Collection",
    modelId: "translatableCollection",
    titleFieldId: "collectionId",
    fields: [
        {
            id: "collectionId",
            fieldId: "collectionId",
            storageId: "text@collectionId",
            type: "text",
            label: "Collection ID",
            tags: [],
            placeholderText: null,
            helpText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            multipleValues: false,
            validation: [
                {
                    name: "required",
                    settings: {},
                    message: "Value is required."
                }
            ],
            listValidation: [],
            settings: {}
        },
        {
            id: "items",
            fieldId: "items",
            storageId: "object@items",
            type: "object",
            label: "Items",
            tags: [],
            placeholderText: null,
            helpText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            multipleValues: true,
            validation: [],
            listValidation: [],
            settings: {
                fields: [
                    {
                        id: "itemId",
                        label: "Item ID",
                        type: "text",
                        validation: [
                            {
                                message: "Value is required.",
                                name: "required"
                            }
                        ],
                        fieldId: "itemId",
                        storageId: "text@itemId"
                    },
                    {
                        id: "value",
                        label: "Value",
                        type: "long-text",
                        validation: [],
                        fieldId: "value",
                        storageId: "long-text@value"
                    },
                    {
                        id: "modifiedBy",
                        label: "Modified by",
                        type: "json",
                        validation: [],
                        fieldId: "modifiedBy",
                        storageId: "json@modifiedBy"
                    },
                    {
                        settings: {
                            type: "dateTimeWithoutTimezone"
                        },
                        id: "modifiedOn",
                        label: "Modified On",
                        type: "datetime",
                        validation: [],
                        fieldId: "modifiedOn",
                        storageId: "datetime@modifiedOn"
                    }
                ]
            }
        }
    ]
});
