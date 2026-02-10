import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            _templateId: "searchableJsonTemplate",
            searchableItems: [
                { name: "Item 1", tags: ["featured", "new"] },
                { name: "Item 2", tags: ["sale"] },
                { name: "Item 3", tags: ["popular", "trending"] }
            ]
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "searchableJsonTemplate",
            "searchable-json@searchableItemsId": [
                { name: "Item 1", tags: ["featured", "new"] },
                { name: "Item 2", tags: ["sale"] },
                { name: "Item 3", tags: ["popular", "trending"] }
            ]
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "content",
                        type: "dynamicZone",
                        multipleValues: false,
                        settings: {
                            templates: [
                                {
                                    id: "searchableJsonTemplate",
                                    name: "Searchable JSON Template",
                                    gqlTypeName: "SearchableJsonTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "searchableItems",
                                            type: "searchable-json",
                                            multipleValues: true
                                        })
                                    ],
                                    layout: [],
                                    validation: []
                                }
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with dynamic zone with multiple searchable-json template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with dynamic zone with multiple searchable-json template to and from storage", async () => {
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
