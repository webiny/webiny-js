import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            name: "John Doe"
        },
        {
            name: "Jane Smith"
        },
        {
            name: "Bob Johnson"
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "text@nameId": "John Doe"
        },
        {
            "text@nameId": "Jane Smith"
        },
        {
            "text@nameId": "Bob Johnson"
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
                        fieldId: "name",
                        type: "text",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single text child to and from storage", async () => {
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

