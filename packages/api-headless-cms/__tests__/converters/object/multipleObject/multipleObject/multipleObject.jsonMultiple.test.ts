import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        configs: [
            {
                data: [
                    {
                        presets: [{ name: "preset1", value: 100 }, { name: "preset2", value: 150 }]
                    },
                    {
                        presets: [{ name: "preset3", value: 200 }]
                    }
                ]
            },
            {
                data: [
                    {
                        presets: [{ name: "preset4", value: 250 }]
                    }
                ]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@configsId": [
            {
                "object@dataId": [
                    {
                        "json@presetsId": [{ name: "preset1", value: 100 }, { name: "preset2", value: 150 }]
                    },
                    {
                        "json@presetsId": [{ name: "preset3", value: 200 }]
                    }
                ]
            },
            {
                "object@dataId": [
                    {
                        "json@presetsId": [{ name: "preset4", value: 250 }]
                    }
                ]
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
                        fieldId: "configs",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "data",
                                    type: "object",
                                    multipleValues: true,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "presets",
                                                type: "json",
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

describe("object storage converter - single object with multiple objects with multiple nested objects with multiple json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with multiple nested objects with multiple json child to and from storage", async () => {
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

