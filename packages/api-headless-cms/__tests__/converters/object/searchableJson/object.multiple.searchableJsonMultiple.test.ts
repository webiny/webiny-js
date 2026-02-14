import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    products: [
        {
            searchableItems: [
                { name: "Product 1 - Item 1", price: 100 },
                { name: "Product 1 - Item 2", price: 150 }
            ]
        },
        {
            searchableItems: [
                { name: "Product 2 - Item 1", price: 200 },
                { name: "Product 2 - Item 2", price: 250 }
            ]
        },
        {
            searchableItems: [
                { name: "Product 3 - Item 1", price: 300 },
                { name: "Product 3 - Item 2", price: 350 },
                { name: "Product 3 - Item 3", price: 400 }
            ]
        }
    ]
};
const convertedValue = {
    "object@productsId": [
        {
            "searchable-json@searchableItemsId": [
                { name: "Product 1 - Item 1", price: 100 },
                { name: "Product 1 - Item 2", price: 150 }
            ]
        },
        {
            "searchable-json@searchableItemsId": [
                { name: "Product 2 - Item 1", price: 200 },
                { name: "Product 2 - Item 2", price: 250 }
            ]
        },
        {
            "searchable-json@searchableItemsId": [
                { name: "Product 3 - Item 1", price: 300 },
                { name: "Product 3 - Item 2", price: 350 },
                { name: "Product 3 - Item 3", price: 400 }
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "products",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "searchableItems",
                        type: "searchable-json",
                        list: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with multiple searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple searchable-json child to and from storage", async () => {
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
