import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    searchableData: {
        title: "Product Name",
        description: "Product description that is searchable",
        category: "electronics",
        price: 299.99
    }
};
const convertedValue = {
    "searchable-json@searchableDataId": {
        title: "Product Name",
        description: "Product description that is searchable",
        category: "electronics",
        price: 299.99
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "searchableData",
            type: "searchable-json",
            list: false
        })
    ]
});

describe("searchable-json storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert searchable-json field value to and from storage", async () => {
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
