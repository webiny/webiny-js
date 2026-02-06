import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    contents: [
        "First rich text with <strong>bold</strong> formatting.",
        "Second rich text with <em>italic</em> formatting.",
        "Third rich text with <u>underline</u> formatting."
    ]
};
const convertedValue = {
    "rich-text@contentsId": [
        "First rich text with <strong>bold</strong> formatting.",
        "Second rich text with <em>italic</em> formatting.",
        "Third rich text with <u>underline</u> formatting."
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "contents",
            type: "rich-text",
            multipleValues: true
        })
    ]
});

describe("rich-text storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple rich-text field value to and from storage", async () => {
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

