import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    config: {
        metadata: {
            theme: "dark",
            layout: "grid",
            settings: { showIcons: true }
        }
    }
};
const convertedValue = {
    "object@configId": {
        "json@metadataId": {
            theme: "dark",
            layout: "grid",
            settings: { showIcons: true }
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "config",
            type: "object",
            multipleValues: false,
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

describe("object storage converter - single object with single json child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single json child to and from storage", async () => {
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
