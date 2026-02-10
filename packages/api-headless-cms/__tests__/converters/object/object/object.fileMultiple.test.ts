import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        media: {
            attachments: [
                "https://example.com/files/file1.pdf",
                "https://example.com/files/file2.pdf",
                "https://example.com/files/file3.pdf"
            ]
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "object@mediaId": {
            "file@attachmentsId": [
                "https://example.com/files/file1.pdf",
                "https://example.com/files/file2.pdf",
                "https://example.com/files/file3.pdf"
            ]
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "media",
                        type: "object",
                        multipleValues: false,
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
            }
        })
    ]
});

describe("object storage converter - single object with single nested object with multiple file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert nested object field with multiple file child to and from storage", async () => {
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
