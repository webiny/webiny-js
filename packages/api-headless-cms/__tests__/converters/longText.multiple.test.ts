import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    descriptions: [
        "First long text paragraph with detailed content.",
        "Second long text paragraph with more information.",
        "Third long text paragraph with additional details."
    ]
};
const convertedValue = {
    "long-text@descriptionsId": [
        "First long text paragraph with detailed content.",
        "Second long text paragraph with more information.",
        "Third long text paragraph with additional details."
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "descriptions",
            type: "long-text",
            multipleValues: true
        })
    ]
});

describe("long-text storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple long-text field value to and from storage", async () => {
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

