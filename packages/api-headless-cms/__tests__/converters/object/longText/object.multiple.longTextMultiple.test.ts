import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    articles: [
        {
            paragraphs: [
                "First article, first paragraph with content.",
                "First article, second paragraph with more details."
            ]
        },
        {
            paragraphs: [
                "Second article, first paragraph discussing the topic.",
                "Second article, second paragraph expanding on ideas."
            ]
        },
        {
            paragraphs: [
                "Third article, first paragraph introducing concepts.",
                "Third article, second paragraph providing examples.",
                "Third article, third paragraph with conclusions."
            ]
        }
    ]
};
const convertedValue = {
    "object@articlesId": [
        {
            "long-text@paragraphsId": [
                "First article, first paragraph with content.",
                "First article, second paragraph with more details."
            ]
        },
        {
            "long-text@paragraphsId": [
                "Second article, first paragraph discussing the topic.",
                "Second article, second paragraph expanding on ideas."
            ]
        },
        {
            "long-text@paragraphsId": [
                "Third article, first paragraph introducing concepts.",
                "Third article, second paragraph providing examples.",
                "Third article, third paragraph with conclusions."
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "articles",
            type: "object",
            multipleValues: true,
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

describe("object storage converter - multiple object with multiple long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple long-text child to and from storage", async () => {
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
