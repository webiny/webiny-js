import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    searchableItems: [
        { name: "Item 1", tags: ["featured", "new"], price: 99 },
        { name: "Item 2", tags: ["sale", "popular"], price: 149 },
        { name: "Item 3", tags: ["trending"], price: 199 }
    ]
};
const convertedValue = {
    "searchable-json@searchableItemsId": [
        { name: "Item 1", tags: ["featured", "new"], price: 99 },
        { name: "Item 2", tags: ["sale", "popular"], price: 149 },
        { name: "Item 3", tags: ["trending"], price: 199 }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "searchableItems",
            type: "searchable-json",
            list: true
        })
    ]
});

describe("searchable-json storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple searchable-json field value to and from storage", async () => {
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
