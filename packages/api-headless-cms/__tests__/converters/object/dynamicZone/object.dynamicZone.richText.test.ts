import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            _templateId: "richTextTemplate",
            body: "This is <strong>bold</strong> and <em>italic</em> text with <u>underline</u>."
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "richTextTemplate",
            "rich-text@bodyId":
                "This is <strong>bold</strong> and <em>italic</em> text with <u>underline</u>."
        }
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
                        type: "dynamicZone",
                        multipleValues: false,
                        settings: {
                            templates: [
                                {
                                    id: "richTextTemplate",
                                    name: "Rich Text Template",
                                    gqlTypeName: "RichTextTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "body",
                                            type: "rich-text",
                                            multipleValues: false
                                        })
                                    ],
                                    layout: [],
                                    validation: []
                                }
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with dynamic zone with rich-text template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with dynamic zone with rich-text template to and from storage", async () => {
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
