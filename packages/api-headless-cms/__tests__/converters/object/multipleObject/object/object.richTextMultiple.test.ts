import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            content: {
                sections: ["First profile with <strong>bold</strong>.", "First profile with <em>italic</em>."]
            }
        },
        {
            content: {
                sections: ["Second profile with <u>underline</u>."]
            }
        },
        {
            content: {
                sections: ["Third profile section 1.", "Third profile section 2.", "Third profile section 3."]
            }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "object@contentId": {
                "rich-text@sectionsId": ["First profile with <strong>bold</strong>.", "First profile with <em>italic</em>."]
            }
        },
        {
            "object@contentId": {
                "rich-text@sectionsId": ["Second profile with <u>underline</u>."]
            }
        },
        {
            "object@contentId": {
                "rich-text@sectionsId": ["Third profile section 1.", "Third profile section 2.", "Third profile section 3."]
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

describe("object storage converter - multiple objects with single nested object with multiple rich-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single nested object with multiple rich-text child to and from storage", async () => {
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

