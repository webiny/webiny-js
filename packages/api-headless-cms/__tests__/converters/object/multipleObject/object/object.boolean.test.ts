import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        settings: [
            {
                config: {
                    isActive: true
                }
            },
            {
                config: {
                    isActive: false
                }
            },
            {
                config: {
                    isActive: true
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@settingsId": [
            {
                "object@configId": {
                    "boolean@isActiveId": true
                }
            },
            {
                "object@configId": {
                    "boolean@isActiveId": false
                }
            },
            {
                "object@configId": {
                    "boolean@isActiveId": true
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
                        fieldId: "settings",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "config",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "isActive",
                                                type: "boolean",
                                                multipleValues: false
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

describe("object storage converter - single object with multiple objects with nested object with boolean child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with boolean child to and from storage", async () => {
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
