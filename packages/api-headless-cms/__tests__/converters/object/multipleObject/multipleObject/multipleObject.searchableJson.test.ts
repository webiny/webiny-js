import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        searches: [
            {
                items: [
                    {
                        searchableData: {
                            title: "Item 1 Title",
                            description: "Item 1 description"
                        }
                    },
                    {
                        searchableData: {
                            title: "Item 2 Title",
                            description: "Item 2 description"
                        }
                    }
                ]
            },
            {
                items: [
                    {
                        searchableData: {
                            title: "Item 3 Title",
                            description: "Item 3 description"
                        }
                    }
                ]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@searchesId": [
            {
                "object@itemsId": [
                    {
                        "searchable-json@searchableDataId": {
                            title: "Item 1 Title",
                            description: "Item 1 description"
                        }
                    },
                    {
                        "searchable-json@searchableDataId": {
                            title: "Item 2 Title",
                            description: "Item 2 description"
                        }
                    }
                ]
            },
            {
                "object@itemsId": [
                    {
                        "searchable-json@searchableDataId": {
                            title: "Item 3 Title",
                            description: "Item 3 description"
                        }
                    }
                ]
            }
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "searches",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "items",
                                    type: "object",
                                    list: true,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "searchableData",
                                                type: "searchable-json",
                                                list: false
                                            })
                                        ]
                                    }
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple objects with multiple nested objects with searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with multiple nested objects with searchable-json child to and from storage", async () => {
        const { convertFromStorage, convertToStorage } = converters;

        const storageResult = convertToStorage({
            fields: model.fields,
            values: plainValue
        });

        expect(storageResult).toEqual(convertedValue);

        const fromStorageResult = convertFromStorage({
            fields: model.fields,
            values: storageResult
        });

        expect(fromStorageResult).toEqual(plainValue);
    });
});
