import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: [
            {
                description: "First long text description with detailed content."
            },
            {
                description: "Second long text description with more information."
            },
            {
                description: "Third long text description with final thoughts."
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": [
            {
                "long-text@descriptionId": "First long text description with detailed content."
            },
            {
                "long-text@descriptionId": "Second long text description with more information."
            },
            {
                "long-text@descriptionId": "Third long text description with final thoughts."
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
                        fieldId: "content",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "description",
                                    type: "long-text",
                                    multipleValues: false
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple nested objects with long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple nested objects with long-text child to and from storage", async () => {
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

