import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            paragraphs: ["First profile, first paragraph.", "First profile, second paragraph."]
        },
        {
            paragraphs: [
                "Second profile, first paragraph.",
                "Second profile, second paragraph.",
                "Second profile, third paragraph."
            ]
        },
        {
            paragraphs: ["Third profile, first paragraph."]
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "long-text@paragraphsId": [
                "First profile, first paragraph.",
                "First profile, second paragraph."
            ]
        },
        {
            "long-text@paragraphsId": [
                "Second profile, first paragraph.",
                "Second profile, second paragraph.",
                "Second profile, third paragraph."
            ]
        },
        {
            "long-text@paragraphsId": ["Third profile, first paragraph."]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "paragraphs",
                        type: "long-text",
                        multipleValues: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with multiple long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with multiple long-text child to and from storage", async () => {
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
