import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: [
            {
                texts: [
                    {
                        description: "First text description."
                    },
                    {
                        description: "Second text description."
                    }
                ]
            },
            {
                texts: [
                    {
                        description: "Third text description."
                    }
                ]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": [
            {
                "object@textsId": [
                    {
                        "long-text@descriptionId": "First text description."
                    },
                    {
                        "long-text@descriptionId": "Second text description."
                    }
                ]
            },
            {
                "object@textsId": [
                    {
                        "long-text@descriptionId": "Third text description."
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
                        fieldId: "content",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "texts",
                                    type: "object",
                                    list: true,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "description",
                                                type: "long-text",
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

describe("object storage converter - single object with multiple objects with multiple nested objects with long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with multiple nested objects with long-text child to and from storage", async () => {
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
