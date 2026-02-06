import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "objectTemplate",
        settings: {
            name: "Configuration Name",
            age: 25,
            isActive: true
        }
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "objectTemplate",
        "object@settingsId": {
            "text@nameId": "Configuration Name",
            "number@ageId": 25,
            "boolean@isActiveId": true
        }
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
                        id: "objectTemplate",
                        name: "Object Template",
                        gqlTypeName: "ObjectTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "settings",
                                type: "object",
                                multipleValues: false,
                                settings: {
                                    fields: [
                                        createModelField({
                                            fieldId: "name",
                                            type: "text",
                                            multipleValues: false
                                        }),
                                        createModelField({
                                            fieldId: "age",
                                            type: "number",
                                            multipleValues: false
                                        }),
                                        createModelField({
                                            fieldId: "isActive",
                                            type: "boolean",
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

describe("dynamicZone storage converter - single dynamic zone with object template containing multiple fields", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with object template containing text, number, and boolean fields to and from storage", async () => {
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
