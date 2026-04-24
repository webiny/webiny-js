import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "textTemplate",
        tags: ["tag1", "tag2", "tag3"]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "textTemplate",
        "text@tagsId": ["tag1", "tag2", "tag3"]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            list: false,
            settings: {
                templates: [
                    {
                        id: "textTemplate",
                        name: "Text Template",
                        gqlTypeName: "TextTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "tags",
                                type: "text",
                                list: true
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

describe("dynamicZone storage converter - single dynamic zone with multiple text template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with multiple text template to and from storage", async () => {
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
