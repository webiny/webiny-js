import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    product: {
        searchableData: {
            title: "Product Name",
            description: "Searchable product description",
            category: "electronics"
        }
    }
};
const convertedValue = {
    "object@productId": {
        "searchable-json@searchableDataId": {
            title: "Product Name",
            description: "Searchable product description",
            category: "electronics"
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "product",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "searchableData",
                        type: "searchable-json",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with single searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single searchable-json child to and from storage", async () => {
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
