import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    document: {
        attachment: "https://example.com/files/document.pdf"
    }
};
const convertedValue = {
    "object@documentId": {
        "file@attachmentId": "https://example.com/files/document.pdf"
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "document",
            type: "object",
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "attachment",
                        type: "file",
                        list: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with single file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with single file child to and from storage", async () => {
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
