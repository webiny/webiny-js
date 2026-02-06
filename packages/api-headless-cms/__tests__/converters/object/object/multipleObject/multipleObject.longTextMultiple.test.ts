import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: [
            {
                paragraphs: ["First item, first paragraph.", "First item, second paragraph."]
            },
            {
                paragraphs: ["Second item, first paragraph.", "Second item, second paragraph.", "Second item, third paragraph."]
            },
            {
                paragraphs: ["Third item, first paragraph."]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": [
            {
                "long-text@paragraphsId": ["First item, first paragraph.", "First item, second paragraph."]
            },
            {
                "long-text@paragraphsId": ["Second item, first paragraph.", "Second item, second paragraph.", "Second item, third paragraph."]
            },
            {
                "long-text@paragraphsId": ["Third item, first paragraph."]
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
                                    fieldId: "paragraphs",
                                    type: "long-text",
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

describe("object storage converter - single object with multiple nested objects with multiple long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple nested objects with multiple long-text child to and from storage", async () => {
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

