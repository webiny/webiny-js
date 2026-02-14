import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    blogs: [
        {
            content: "First blog with <strong>bold</strong> text."
        },
        {
            content: "Second blog with <em>italic</em> text."
        },
        {
            content: "Third blog with <u>underline</u> text."
        }
    ]
};
const convertedValue = {
    "object@blogsId": [
        {
            "rich-text@contentId": "First blog with <strong>bold</strong> text."
        },
        {
            "rich-text@contentId": "Second blog with <em>italic</em> text."
        },
        {
            "rich-text@contentId": "Third blog with <u>underline</u> text."
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
                        fieldId: "content",
                        type: "rich-text",
                        list: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single rich-text child to and from storage", async () => {
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
