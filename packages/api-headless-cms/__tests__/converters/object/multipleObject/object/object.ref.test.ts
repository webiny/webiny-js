import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        relations: [
            {
                refs: {
                    author: {
                        id: "author1#0001",
                        entryId: "author1",
                        modelId: "author"
                    }
                }
            },
            {
                refs: {
                    author: {
                        id: "author2#0001",
                        entryId: "author2",
                        modelId: "author"
                    }
                }
            },
            {
                refs: {
                    author: {
                        id: "author3#0001",
                        entryId: "author3",
                        modelId: "author"
                    }
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@relationsId": [
            {
                "object@refsId": {
                    "ref@authorId": {
                        id: "author1#0001",
                        entryId: "author1",
                        modelId: "author"
                    }
                }
            },
            {
                "object@refsId": {
                    "ref@authorId": {
                        id: "author2#0001",
                        entryId: "author2",
                        modelId: "author"
                    }
                }
            },
            {
                "object@refsId": {
                    "ref@authorId": {
                        id: "author3#0001",
                        entryId: "author3",
                        modelId: "author"
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
                        fieldId: "relations",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "refs",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "author",
                                                type: "ref",
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

describe("object storage converter - single object with multiple objects with nested object with ref child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with ref child to and from storage", async () => {
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
