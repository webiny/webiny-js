import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    configs: [
        {
            presets: [
                { name: "preset1", value: 100 },
                { name: "preset2", value: 200 }
            ]
        },
        {
            presets: [
                { name: "preset3", value: 300 },
                { name: "preset4", value: 400 }
            ]
        },
        {
            presets: [
                { name: "preset5", value: 500 },
                { name: "preset6", value: 600 },
                { name: "preset7", value: 700 }
            ]
        }
    ]
};
const convertedValue = {
    "object@configsId": [
        {
            "json@presetsId": [
                { name: "preset1", value: 100 },
                { name: "preset2", value: 200 }
            ]
        },
        {
            "json@presetsId": [
                { name: "preset3", value: 300 },
                { name: "preset4", value: 400 }
            ]
        },
        {
            "json@presetsId": [
                { name: "preset5", value: 500 },
                { name: "preset6", value: 600 },
                { name: "preset7", value: 700 }
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "configs",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "presets",
                        type: "json",
                        list: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with multiple json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple json child to and from storage", async () => {
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
