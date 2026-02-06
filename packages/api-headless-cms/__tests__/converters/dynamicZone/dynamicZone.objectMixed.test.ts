import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "mixedTemplate",
        config: {
            title: "Main Config",
            metadata: { theme: "dark", layout: "grid" }
        },
        items: [
            {
                label: "Item 1",
                value: 100
            },
            {
                label: "Item 2",
                value: 200
            }
        ]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "mixedTemplate",
        "object@configId": {
            "text@titleId": "Main Config",
            "json@metadataId": { theme: "dark", layout: "grid" }
        },
        "object@itemsId": [
            {
                "text@labelId": "Item 1",
                "number@valueId": 100
            },
            {
                "text@labelId": "Item 2",
                "number@valueId": 200
            }
        ]
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
                        id: "mixedTemplate",
                        name: "Mixed Template",
                        gqlTypeName: "MixedTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "config",
                                type: "object",
                                multipleValues: false,
                                settings: {
                                    fields: [
                                        createModelField({
                                            fieldId: "title",
                                            type: "text",
                                            multipleValues: false
                                        }),
                                        createModelField({
                                            fieldId: "metadata",
                                            type: "json",
                                            multipleValues: false
                                        })
                                    ]
                                }
                            }),
                            createModelField({
                                fieldId: "items",
                                type: "object",
                                multipleValues: true,
                                settings: {
                                    fields: [
                                        createModelField({
                                            fieldId: "label",
                                            type: "text",
                                            multipleValues: false
                                        }),
                                        createModelField({
                                            fieldId: "value",
                                            type: "number",
                                            multipleValues: false
                                        })
                                    ]
                                }
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

describe("dynamicZone storage converter - single dynamic zone with mixed single and multiple object templates", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with both single and multiple object fields to and from storage", async () => {
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
