import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    relatedArticles: [
        {
            id: "article1#0001",
            entryId: "article1",
            modelId: "article"
        },
        {
            id: "article2#0001",
            entryId: "article2",
            modelId: "article"
        },
        {
            id: "article3#0001",
            entryId: "article3",
            modelId: "article"
        }
    ]
};
const convertedValue = {
    "ref@relatedArticlesId": [
        {
            id: "article1#0001",
            entryId: "article1",
            modelId: "article"
        },
        {
            id: "article2#0001",
            entryId: "article2",
            modelId: "article"
        },
        {
            id: "article3#0001",
            entryId: "article3",
            modelId: "article"
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "relatedArticles",
            type: "ref",
            multipleValues: true
        })
    ]
});

describe("ref storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple ref field value to and from storage", async () => {
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

