import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            content: {
                body: "First profile with <strong>bold</strong> text."
            }
        },
        {
            content: {
                body: "Second profile with <em>italic</em> text."
            }
        },
        {
            content: {
                body: "Third profile with <u>underline</u> text."
            }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "object@contentId": {
                "rich-text@bodyId": "First profile with <strong>bold</strong> text."
            }
        },
        {
            "object@contentId": {
                "rich-text@bodyId": "Second profile with <em>italic</em> text."
            }
        },
        {
            "object@contentId": {
                "rich-text@bodyId": "Third profile with <u>underline</u> text."
            }
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "content",
                        type: "object",
                        multipleValues: false,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "body",
                                    type: "rich-text",
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

describe("object storage converter - multiple objects with single nested object with rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single nested object with rich-text child to and from storage", async () => {
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

