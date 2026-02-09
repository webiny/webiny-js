import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            searchableItems: [
                { name: "Item 1", tags: ["featured"] },
                { name: "Item 2", tags: ["new"] }
            ]
        },
        {
            searchableItems: [{ name: "Item 3", tags: ["sale", "popular"] }]
        },
        {
            searchableItems: [
                { name: "Item 4", tags: ["trending"] },
                { name: "Item 5", tags: ["featured", "sale"] },
                { name: "Item 6", tags: ["new", "popular"] }
            ]
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "searchable-json@searchableItemsId": [
                { name: "Item 1", tags: ["featured"] },
                { name: "Item 2", tags: ["new"] }
            ]
        },
        {
            "searchable-json@searchableItemsId": [{ name: "Item 3", tags: ["sale", "popular"] }]
        },
        {
            "searchable-json@searchableItemsId": [
                { name: "Item 4", tags: ["trending"] },
                { name: "Item 5", tags: ["featured", "sale"] },
                { name: "Item 6", tags: ["new", "popular"] }
            ]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
            type: "object",
            multipleValues: true,
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

describe("object storage converter - multiple objects with multiple searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with multiple searchable-json child to and from storage", async () => {
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
