import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        configs: [
            {
                data: {
                    metadata: { theme: "dark", layout: "grid" }
                }
            },
            {
                data: {
                    metadata: { theme: "light", layout: "list" }
                }
            },
            {
                data: {
                    metadata: { theme: "auto", layout: "table" }
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@configsId": [
            {
                "object@dataId": {
                    "json@metadataId": { theme: "dark", layout: "grid" }
                }
            },
            {
                "object@dataId": {
                    "json@metadataId": { theme: "light", layout: "list" }
                }
            },
            {
                "object@dataId": {
                    "json@metadataId": { theme: "auto", layout: "table" }
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
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "configs",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "data",
                                    type: "object",
                                    list: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "metadata",
                                                type: "json",
                                                list: false
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

describe("object storage converter - single object with multiple objects with nested object with json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with json child to and from storage", async () => {
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
