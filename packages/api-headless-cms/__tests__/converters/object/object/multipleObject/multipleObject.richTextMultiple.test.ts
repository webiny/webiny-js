import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: [
            {
                sections: ["First item with <strong>bold</strong>.", "First item with <em>italic</em>."]
            },
            {
                sections: ["Second item with <u>underline</u>."]
            },
            {
                sections: ["Third item section 1.", "Third item section 2.", "Third item section 3."]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": [
            {
                "rich-text@sectionsId": ["First item with <strong>bold</strong>.", "First item with <em>italic</em>."]
            },
            {
                "rich-text@sectionsId": ["Second item with <u>underline</u>."]
            },
            {
                "rich-text@sectionsId": ["Third item section 1.", "Third item section 2.", "Third item section 3."]
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
                                    fieldId: "sections",
                                    type: "rich-text",
                                    multipleValues: true
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple nested objects with multiple rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple nested objects with multiple rich-text child to and from storage", async () => {
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

