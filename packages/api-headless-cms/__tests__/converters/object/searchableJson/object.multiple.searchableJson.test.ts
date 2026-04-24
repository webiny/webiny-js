import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    products: [
        {
            searchableData: {
                title: "Product 1",
                category: "electronics"
            }
        },
        {
            searchableData: {
                title: "Product 2",
                category: "clothing"
            }
        },
        {
            searchableData: {
                title: "Product 3",
                category: "books"
            }
        }
    ]
};
const convertedValue = {
    "object@productsId": [
        {
            "searchable-json@searchableDataId": {
                title: "Product 1",
                category: "electronics"
            }
        },
        {
            "searchable-json@searchableDataId": {
                title: "Product 2",
                category: "clothing"
            }
        },
        {
            "searchable-json@searchableDataId": {
                title: "Product 3",
                category: "books"
            }
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
                        fieldId: "searchableData",
                        type: "searchable-json",
                        list: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single searchable-json child to and from storage", async () => {
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
