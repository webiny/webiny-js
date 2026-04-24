import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    age: 25
};
const convertedValue = {
    "number@ageId": 25
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "age",
            type: "number",
            list: false
        })
    ]
});

describe("number storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert number field value to and from storage", async () => {
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
