import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    metadata: {
        color: "blue",
        size: "large",
        tags: ["featured", "new"],
        price: 99.99
    }
};
const convertedValue = {
    "json@metadataId": {
        color: "blue",
        size: "large",
        tags: ["featured", "new"],
        price: 99.99
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "metadata",
            type: "json",
            multipleValues: false
        })
    ]
});

describe("json storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert json field value to and from storage", async () => {
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

