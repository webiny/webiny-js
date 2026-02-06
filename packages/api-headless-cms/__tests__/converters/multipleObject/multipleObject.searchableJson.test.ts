import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            searchableData: {
                title: "Profile 1 Title",
                description: "Searchable profile 1 description"
            }
        },
        {
            searchableData: {
                title: "Profile 2 Title",
                description: "Searchable profile 2 description"
            }
        },
        {
            searchableData: {
                title: "Profile 3 Title",
                description: "Searchable profile 3 description"
            }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "searchable-json@searchableDataId": {
                title: "Profile 1 Title",
                description: "Searchable profile 1 description"
            }
        },
        {
            "searchable-json@searchableDataId": {
                title: "Profile 2 Title",
                description: "Searchable profile 2 description"
            }
        },
        {
            "searchable-json@searchableDataId": {
                title: "Profile 3 Title",
                description: "Searchable profile 3 description"
            }
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
                        fieldId: "searchableData",
                        type: "searchable-json",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single searchable-json child to and from storage", async () => {
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

