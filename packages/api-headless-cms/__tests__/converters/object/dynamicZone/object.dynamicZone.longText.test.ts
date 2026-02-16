import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            _templateId: "longTextTemplate",
            description:
                "This is a long text description with multiple paragraphs and detailed information."
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "longTextTemplate",
            "long-text@descriptionId":
                "This is a long text description with multiple paragraphs and detailed information."
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
                        type: "dynamicZone",
                        list: false,
                        settings: {
                            templates: [
                                {
                                    id: "longTextTemplate",
                                    name: "Long Text Template",
                                    gqlTypeName: "LongTextTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "description",
                                            type: "long-text",
                                            list: false
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

describe("object storage converter - single object with dynamic zone with long-text template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with dynamic zone with long-text template to and from storage", async () => {
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
