import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    description:
        "This is a long text field that can contain multiple paragraphs and longer content."
};
const convertedValue = {
    "long-text@descriptionId":
        "This is a long text field that can contain multiple paragraphs and longer content."
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "description",
            type: "long-text",
            list: false
        })
    ]
});

describe("long-text storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert long-text field value to and from storage", async () => {
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
