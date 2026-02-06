import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    documents: [
        {
            attachment: "https://example.com/files/document1.pdf"
        },
        {
            attachment: "https://example.com/files/document2.pdf"
        },
        {
            attachment: "https://example.com/files/document3.pdf"
        }
    ]
};
const convertedValue = {
    "object@documentsId": [
        {
            "file@attachmentId": "https://example.com/files/document1.pdf"
        },
        {
            "file@attachmentId": "https://example.com/files/document2.pdf"
        },
        {
            "file@attachmentId": "https://example.com/files/document3.pdf"
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "documents",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "attachment",
                        type: "file",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single file child to and from storage", async () => {
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
