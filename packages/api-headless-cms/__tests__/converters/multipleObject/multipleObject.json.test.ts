import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            metadata: { theme: "dark", layout: "grid" }
        },
        {
            metadata: { theme: "light", layout: "list" }
        },
        {
            metadata: { theme: "auto", layout: "table" }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "json@metadataId": { theme: "dark", layout: "grid" }
        },
        {
            "json@metadataId": { theme: "light", layout: "list" }
        },
        {
            "json@metadataId": { theme: "auto", layout: "table" }
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
                        fieldId: "metadata",
                        type: "json",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single json child to and from storage", async () => {
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
