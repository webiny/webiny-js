import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    author: {
        id: "author#0001",
        entryId: "author",
        modelId: "author"
    }
};
const convertedValue = {
    "ref@authorId": {
        id: "author#0001",
        entryId: "author",
        modelId: "author"
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "author",
            type: "ref",
            list: false
        })
    ]
});

describe("ref storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert ref field value to and from storage", async () => {
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
