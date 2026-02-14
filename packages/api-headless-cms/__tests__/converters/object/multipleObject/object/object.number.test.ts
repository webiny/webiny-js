import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        items: [
            {
                data: {
                    age: 25
                }
            },
            {
                data: {
                    age: 30
                }
            },
            {
                data: {
                    age: 35
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
                    "number@ageId": 25
                }
            },
            {
                "object@dataId": {
                    "number@ageId": 30
                }
            },
            {
                "object@dataId": {
                    "number@ageId": 35
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
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "items",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "data",
                                    type: "object",
                                    list: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "age",
                                                type: "number",
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

describe("object storage converter - single object with multiple objects with nested object with number child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with number child to and from storage", async () => {
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
