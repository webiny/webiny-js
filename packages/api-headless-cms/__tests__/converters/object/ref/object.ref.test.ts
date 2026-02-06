import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    post: {
        author: {
            id: "author#0001",
            entryId: "author",
            modelId: "author"
        }
    }
};
const convertedValue = {
    "object@postId": {
        "ref@authorId": {
            id: "author#0001",
            entryId: "author",
            modelId: "author"
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "post",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "author",
                        type: "ref",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with single ref child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single ref child to and from storage", async () => {
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
