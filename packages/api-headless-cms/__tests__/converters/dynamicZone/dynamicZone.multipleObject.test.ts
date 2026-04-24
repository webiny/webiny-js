import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "objectTemplate",
        profiles: [
            {
                name: "John Doe",
                age: 25,
                isActive: true
            },
            {
                name: "Jane Smith",
                age: 30,
                isActive: false
            },
            {
                name: "Bob Johnson",
                age: 35,
                isActive: true
            }
        ]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "objectTemplate",
        "object@profilesId": [
            {
                "text@nameId": "John Doe",
                "number@ageId": 25,
                "boolean@isActiveId": true
            },
            {
                "text@nameId": "Jane Smith",
                "number@ageId": 30,
                "boolean@isActiveId": false
            },
            {
                "text@nameId": "Bob Johnson",
                "number@ageId": 35,
                "boolean@isActiveId": true
            }
        ]
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
                        id: "objectTemplate",
                        name: "Object Template",
                        gqlTypeName: "ObjectTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "profiles",
                                type: "object",
                                list: true,
                                settings: {
                                    fields: [
                                        createModelField({
                                            fieldId: "name",
                                            type: "text",
                                            list: false
                                        }),
                                        createModelField({
                                            fieldId: "age",
                                            type: "number",
                                            list: false
                                        }),
                                        createModelField({
                                            fieldId: "isActive",
                                            type: "boolean",
                                            list: false
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

describe("dynamicZone storage converter - single dynamic zone with multiple object template containing multiple fields", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with multiple object template containing text, number, and boolean fields to and from storage", async () => {
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
