import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    images: [
        "https://example.com/files/image1.jpg",
        "https://example.com/files/image2.jpg",
        "https://example.com/files/image3.jpg"
    ]
};
const convertedValue = {
    "file@imagesId": [
        "https://example.com/files/image1.jpg",
        "https://example.com/files/image2.jpg",
        "https://example.com/files/image3.jpg"
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "images",
            type: "file",
            multipleValues: true
        })
    ]
});

describe("file storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple file field value to and from storage", async () => {
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
