import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    article: {
        paragraphs: [
            "First paragraph with detailed content about the topic.",
            "Second paragraph providing more context and information.",
            "Third paragraph concluding the article with final thoughts."
        ]
    }
};
const convertedValue = {
    "object@articleId": {
        "long-text@paragraphsId": [
            "First paragraph with detailed content about the topic.",
            "Second paragraph providing more context and information.",
            "Third paragraph concluding the article with final thoughts."
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "article",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "paragraphs",
                        type: "long-text",
                        multipleValues: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with multiple long-text child to and from storage", async () => {
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
