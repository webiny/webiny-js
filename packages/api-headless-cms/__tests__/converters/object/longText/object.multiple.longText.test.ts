import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    articles: [
        {
            description: "First article with a long descriptive text about various topics."
        },
        {
            description: "Second article containing detailed information and analysis."
        },
        {
            description: "Third article with comprehensive coverage of the subject matter."
        }
    ]
};
const convertedValue = {
    "object@articlesId": [
        {
            "long-text@descriptionId":
                "First article with a long descriptive text about various topics."
        },
        {
            "long-text@descriptionId":
                "Second article containing detailed information and analysis."
        },
        {
            "long-text@descriptionId":
                "Third article with comprehensive coverage of the subject matter."
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "articles",
            type: "object",
            multipleValues: true,
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

describe("object storage converter - multiple object with single long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single long-text child to and from storage", async () => {
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
