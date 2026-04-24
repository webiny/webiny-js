import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    blogs: [
        {
            sections: [
                "First blog, first section with <strong>bold</strong>.",
                "First blog, second section with <em>italic</em>."
            ]
        },
        {
            sections: [
                "Second blog, first section with <u>underline</u>.",
                "Second blog, second section with <strike>strikethrough</strike>."
            ]
        },
        {
            sections: [
                "Third blog, first section with formatting.",
                "Third blog, second section with more text.",
                "Third blog, third section with final content."
            ]
        }
    ]
};
const convertedValue = {
    "object@blogsId": [
        {
            "rich-text@sectionsId": [
                "First blog, first section with <strong>bold</strong>.",
                "First blog, second section with <em>italic</em>."
            ]
        },
        {
            "rich-text@sectionsId": [
                "Second blog, first section with <u>underline</u>.",
                "Second blog, second section with <strike>strikethrough</strike>."
            ]
        },
        {
            "rich-text@sectionsId": [
                "Third blog, first section with formatting.",
                "Third blog, second section with more text.",
                "Third blog, third section with final content."
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "blogs",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "sections",
                        type: "rich-text",
                        list: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with multiple rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple rich-text child to and from storage", async () => {
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
