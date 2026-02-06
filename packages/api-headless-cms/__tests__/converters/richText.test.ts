import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    content: "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
};
const convertedValue = {
    "rich-text@contentId": "Rich text content with <strong>bold</strong> and <em>italic</em> formatting."
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "rich-text",
            multipleValues: false
        })
    ]
});

describe("rich-text storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert rich-text field value to and from storage", async () => {
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

