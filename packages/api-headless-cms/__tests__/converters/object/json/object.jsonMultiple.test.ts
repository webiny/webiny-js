import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    config: {
        presets: [
            { name: "preset1", value: 100 },
            { name: "preset2", value: 200 },
            { name: "preset3", value: 300 }
        ]
    }
};
const convertedValue = {
    "object@configId": {
        "json@presetsId": [
            { name: "preset1", value: 100 },
            { name: "preset2", value: 200 },
            { name: "preset3", value: 300 }
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "config",
            type: "object",
            list: false,
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

describe("object storage converter - single object with multiple json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with multiple json child to and from storage", async () => {
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
