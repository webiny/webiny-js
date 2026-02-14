import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            body: "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": {
            "rich-text@bodyId":
                "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
        }
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
                        list: false,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "body",
                                    type: "rich-text",
                                    list: false
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with single nested object with rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert nested object field with rich-text child to and from storage", async () => {
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
