import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: [
            {
                text: {
                    paragraphs: [
                        "First profile, first paragraph.",
                        "First profile, second paragraph."
                    ]
                }
            },
            {
                text: {
                    paragraphs: [
                        "Second profile, first paragraph.",
                        "Second profile, second paragraph.",
                        "Second profile, third paragraph."
                    ]
                }
            },
            {
                text: {
                    paragraphs: ["Third profile, first paragraph."]
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contentId": [
            {
                "object@textId": {
                    "long-text@paragraphsId": [
                        "First profile, first paragraph.",
                        "First profile, second paragraph."
                    ]
                }
            },
            {
                "object@textId": {
                    "long-text@paragraphsId": [
                        "Second profile, first paragraph.",
                        "Second profile, second paragraph.",
                        "Second profile, third paragraph."
                    ]
                }
            },
            {
                "object@textId": {
                    "long-text@paragraphsId": ["Third profile, first paragraph."]
                }
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
                                    fieldId: "text",
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
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple objects with nested object with multiple long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with multiple long-text child to and from storage", async () => {
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
