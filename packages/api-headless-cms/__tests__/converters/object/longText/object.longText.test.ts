import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    article: {
        description:
            "This is a long text description that spans multiple paragraphs and contains detailed information."
    }
};
const convertedValue = {
    "object@articleId": {
        "long-text@descriptionId":
            "This is a long text description that spans multiple paragraphs and contains detailed information."
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "article",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "description",
                        type: "long-text",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with single long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single long-text child to and from storage", async () => {
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
