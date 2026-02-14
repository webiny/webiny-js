import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    authors: [
        {
            tags: ["developer", "writer"]
        },
        {
            tags: ["designer", "artist"]
        },
        {
            tags: ["manager", "leader", "speaker"]
        }
    ]
};
const convertedValue = {
    "object@authorsId": [
        {
            "text@tagsId": ["developer", "writer"]
        },
        {
            "text@tagsId": ["designer", "artist"]
        },
        {
            "text@tagsId": ["manager", "leader", "speaker"]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "authors",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "tags",
                        type: "text",
                        list: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with multiple text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple text child to and from storage", async () => {
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
