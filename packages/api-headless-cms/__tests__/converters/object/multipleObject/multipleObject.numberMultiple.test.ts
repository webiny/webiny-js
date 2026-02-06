import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            scores: [85, 92]
        },
        {
            scores: [78, 88, 95]
        },
        {
            scores: [90]
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "number@scoresId": [85, 92]
        },
        {
            "number@scoresId": [78, 88, 95]
        },
        {
            "number@scoresId": [90]
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
                        fieldId: "scores",
                        type: "number",
                        multipleValues: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with multiple number child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with multiple number child to and from storage", async () => {
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

