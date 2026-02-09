import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    product: {
        searchableItems: [
            { name: "Item 1", tags: ["featured", "new"] },
            { name: "Item 2", tags: ["sale", "popular"] },
            { name: "Item 3", tags: ["trending"] }
        ]
    }
};
const convertedValue = {
    "object@productId": {
        "searchable-json@searchableItemsId": [
            { name: "Item 1", tags: ["featured", "new"] },
            { name: "Item 2", tags: ["sale", "popular"] },
            { name: "Item 3", tags: ["trending"] }
        ]
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
                        fieldId: "searchableItems",
                        type: "searchable-json",
                        multipleValues: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with multiple searchable-json child to and from storage", async () => {
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
