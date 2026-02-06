import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        items: [
            {
                data: {
                    scores: [85, 92]
                }
            },
            {
                data: {
                    scores: [78, 88, 95]
                }
            },
            {
                data: {
                    scores: [90]
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@itemsId": [
            {
                "object@dataId": {
                    "number@scoresId": [85, 92]
                }
            },
            {
                "object@dataId": {
                    "number@scoresId": [78, 88, 95]
                }
            },
            {
                "object@dataId": {
                    "number@scoresId": [90]
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
                        fieldId: "items",
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
                                                fieldId: "scores",
                                                type: "number",
                                                multipleValues: true
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

describe("object storage converter - single object with multiple objects with nested object with multiple number child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with multiple number child to and from storage", async () => {
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
