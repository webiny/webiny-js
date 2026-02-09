import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            age: 25
        },
        {
            age: 30
        },
        {
            age: 35
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "number@ageId": 25
        },
        {
            "number@ageId": 30
        },
        {
            "number@ageId": 35
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
                        fieldId: "age",
                        type: "number",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single number child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single number child to and from storage", async () => {
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
