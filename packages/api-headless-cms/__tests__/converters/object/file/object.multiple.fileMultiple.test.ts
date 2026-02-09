import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    documents: [
        {
            attachments: [
                "https://example.com/files/doc1-file1.pdf",
                "https://example.com/files/doc1-file2.pdf"
            ]
        },
        {
            attachments: [
                "https://example.com/files/doc2-file1.pdf",
                "https://example.com/files/doc2-file2.pdf"
            ]
        },
        {
            attachments: [
                "https://example.com/files/doc3-file1.pdf",
                "https://example.com/files/doc3-file2.pdf",
                "https://example.com/files/doc3-file3.pdf"
            ]
        }
    ]
};
const convertedValue = {
    "object@documentsId": [
        {
            "file@attachmentsId": [
                "https://example.com/files/doc1-file1.pdf",
                "https://example.com/files/doc1-file2.pdf"
            ]
        },
        {
            "file@attachmentsId": [
                "https://example.com/files/doc2-file1.pdf",
                "https://example.com/files/doc2-file2.pdf"
            ]
        },
        {
            "file@attachmentsId": [
                "https://example.com/files/doc3-file1.pdf",
                "https://example.com/files/doc3-file2.pdf",
                "https://example.com/files/doc3-file3.pdf"
            ]
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
                        fieldId: "attachments",
                        type: "file",
                        multipleValues: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with multiple file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with multiple file child to and from storage", async () => {
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
