import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "refTemplate",
        author: {
            id: "author1#0001",
            entryId: "author1",
            modelId: "author"
        }
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "refTemplate",
        "ref@authorId": {
            id: "author1#0001",
            entryId: "author1",
            modelId: "author"
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            multipleValues: false,
            settings: {
                templates: [
                    {
                        id: "refTemplate",
                        name: "Ref Template",
                        gqlTypeName: "RefTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "author",
                                type: "ref",
                                multipleValues: false
                            })
                        ],
                        layout: [],
                        validation: []
                    }
                ]
            }
        })
    ]
});

describe("dynamicZone storage converter - single dynamic zone with ref template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with ref template to and from storage", async () => {
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
