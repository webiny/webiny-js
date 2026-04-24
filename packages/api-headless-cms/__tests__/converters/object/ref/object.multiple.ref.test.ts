import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    posts: [
        {
            author: {
                id: "author1#0001",
                entryId: "author1",
                modelId: "author"
            }
        },
        {
            author: {
                id: "author2#0001",
                entryId: "author2",
                modelId: "author"
            }
        },
        {
            author: {
                id: "author3#0001",
                entryId: "author3",
                modelId: "author"
            }
        }
    ]
};
const convertedValue = {
    "object@postsId": [
        {
            "ref@authorId": {
                id: "author1#0001",
                entryId: "author1",
                modelId: "author"
            }
        },
        {
            "ref@authorId": {
                id: "author2#0001",
                entryId: "author2",
                modelId: "author"
            }
        },
        {
            "ref@authorId": {
                id: "author3#0001",
                entryId: "author3",
                modelId: "author"
            }
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "posts",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "author",
                        type: "ref",
                        list: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single ref child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single ref child to and from storage", async () => {
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
