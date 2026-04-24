import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    blog: {
        content: "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
    }
};
const convertedValue = {
    "object@blogId": {
        "rich-text@contentId":
            "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "blog",
            type: "object",
            list: false,
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

describe("object storage converter - single object with single rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single rich-text child to and from storage", async () => {
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
