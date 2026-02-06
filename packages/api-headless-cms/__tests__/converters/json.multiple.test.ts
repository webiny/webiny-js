import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    configs: [
        { theme: "dark", layout: "grid" },
        { theme: "light", layout: "list" },
        { theme: "auto", layout: "table" }
    ]
};
const convertedValue = {
    "json@configsId": [
        { theme: "dark", layout: "grid" },
        { theme: "light", layout: "list" },
        { theme: "auto", layout: "table" }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "configs",
            type: "json",
            multipleValues: true
        })
    ]
});

describe("json storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple json field value to and from storage", async () => {
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

