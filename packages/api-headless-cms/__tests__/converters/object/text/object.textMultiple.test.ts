import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    author: {
        tags: ["developer", "writer", "speaker"]
    }
};
const convertedValue = {
    "object@authorId": {
        "text@tagsId": ["developer", "writer", "speaker"]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "author",
            type: "object",
            list: false,
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

describe("object storage converter - single object with multiple text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with multiple text child to and from storage", async () => {
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
