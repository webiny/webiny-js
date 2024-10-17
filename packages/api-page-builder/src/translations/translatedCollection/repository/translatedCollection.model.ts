import { createPrivateModel } from "@webiny/api-headless-cms";

export const translatedCollectionModel = createPrivateModel({
    name: "Translated Collection",
    modelId: "translatedCollection",
    titleFieldId: "collectionId",
    fields: [
        {
            id: "collectionId",
            fieldId: "collectionId",
            storageId: "text@collectionId",
            type: "text",
            label: "Collection ID",
            tags: [],
            multipleValues: false,
            validation: [
                {
                    name: "required",
                    settings: {},
                    message: "Value is required."
                }
            ]
        },
        {
            id: "items",
            fieldId: "items",
            storageId: "object@items",
            type: "object",
            label: "Items",
            tags: [],
            multipleValues: true,
            validation: [],
            settings: {
                fields: [
                    {
                        label: "Item ID",
                        id: "itemId",
                        type: "text",
                        validation: [
                            {
                                name: "required",
                                message: "Value is required."
                            }
                        ],
                        fieldId: "itemId",
                        storageId: "text@itemId"
                    },
                    {
                        label: "Value",
                        id: "value",
                        type: "long-text",
                        validation: [],
                        fieldId: "value",
                        storageId: "long-text@value"
                    },
                    {
                        settings: {
                            type: "dateTimeWithTimezone"
                        },
                        label: "Translated On",
                        id: "translatedOn",
                        type: "datetime",
                        validation: [],
                        fieldId: "translatedOn",
                        storageId: "datetime@translatedOn"
                    },
                    {
                        label: "Translated By",
                        id: "translatedBy",
                        type: "json",
                        validation: [],
                        fieldId: "translatedBy",
                        storageId: "json@translatedBy"
                    }
                ]
            }
        },
        {
            id: "languageCode",
            fieldId: "languageCode",
            storageId: "text@languageCode",
            type: "text",
            label: "Language Code",
            tags: [],
            multipleValues: false,
            validation: [
                {
                    name: "required",
                    settings: {},
                    message: "Value is required."
                }
            ]
        }
    ]
});
