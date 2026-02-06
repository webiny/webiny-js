import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "longTextTemplate",
        paragraphs: ["First paragraph with detailed content.", "Second paragraph with more information.", "Third paragraph concluding the text."]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "longTextTemplate",
        "long-text@paragraphsId": ["First paragraph with detailed content.", "Second paragraph with more information.", "Third paragraph concluding the text."]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            multipleValues: false,
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
                                fieldId: "paragraphs",
                                type: "long-text",
                                multipleValues: true
                            })
                        ],
                        layout: [],
                        validation: []
                    }
                ]
            }
        })
    ]
});

describe("dynamicZone storage converter - single dynamic zone with multiple long-text template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with multiple long-text template to and from storage", async () => {
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

