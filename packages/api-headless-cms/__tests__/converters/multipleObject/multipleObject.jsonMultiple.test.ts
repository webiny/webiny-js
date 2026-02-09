import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            presets: [
                { name: "preset1", value: 100 },
                { name: "preset2", value: 150 }
            ]
        },
        {
            presets: [{ name: "preset3", value: 200 }]
        },
        {
            presets: [
                { name: "preset4", value: 250 },
                { name: "preset5", value: 300 },
                { name: "preset6", value: 350 }
            ]
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "json@presetsId": [
                { name: "preset1", value: 100 },
                { name: "preset2", value: 150 }
            ]
        },
        {
            "json@presetsId": [{ name: "preset3", value: 200 }]
        },
        {
            "json@presetsId": [
                { name: "preset4", value: 250 },
                { name: "preset5", value: 300 },
                { name: "preset6", value: 350 }
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
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
});

describe("object storage converter - multiple objects with multiple json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with multiple json child to and from storage", async () => {
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
