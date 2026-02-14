import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        search: {
            searchableData: {
                title: "Profile Title",
                description: "Searchable profile description"
            }
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "object@searchId": {
            "searchable-json@searchableDataId": {
                title: "Profile Title",
                description: "Searchable profile description"
            }
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "search",
                        type: "object",
                        list: false,
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
            }
        })
    ]
});

describe("object storage converter - single object with single nested object with searchable-json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert nested object field with searchable-json child to and from storage", async () => {
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
