import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        searches: [
            {
                data: {
                    searchableData: {
                        title: "Profile 1 Title",
                        description: "Searchable profile 1 description"
                    }
                }
            },
            {
                data: {
                    searchableData: {
                        title: "Profile 2 Title",
                        description: "Searchable profile 2 description"
                    }
                }
            },
            {
                data: {
                    searchableData: {
                        title: "Profile 3 Title",
                        description: "Searchable profile 3 description"
                    }
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@searchesId": [
            {
                "object@dataId": {
                    "searchable-json@searchableDataId": {
                        title: "Profile 1 Title",
                        description: "Searchable profile 1 description"
                    }
                }
            },
            {
                "object@dataId": {
                    "searchable-json@searchableDataId": {
                        title: "Profile 2 Title",
                        description: "Searchable profile 2 description"
                    }
                }
            },
            {
                "object@dataId": {
                    "searchable-json@searchableDataId": {
                        title: "Profile 3 Title",
                        description: "Searchable profile 3 description"
                    }
                }
            }
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "searches",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "data",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "searchableData",
                                                type: "searchable-json",
                                                multipleValues: false
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

describe("object storage converter - single object with multiple objects with nested object with searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with searchable-json child to and from storage", async () => {
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

