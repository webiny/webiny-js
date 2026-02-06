import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        media: [
            {
                files: {
                    attachments: ["https://example.com/files/file1.pdf", "https://example.com/files/file2.pdf"]
                }
            },
            {
                files: {
                    attachments: ["https://example.com/files/file3.pdf"]
                }
            },
            {
                files: {
                    attachments: ["https://example.com/files/file4.pdf", "https://example.com/files/file5.pdf", "https://example.com/files/file6.pdf"]
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@mediaId": [
            {
                "object@filesId": {
                    "file@attachmentsId": ["https://example.com/files/file1.pdf", "https://example.com/files/file2.pdf"]
                }
            },
            {
                "object@filesId": {
                    "file@attachmentsId": ["https://example.com/files/file3.pdf"]
                }
            },
            {
                "object@filesId": {
                    "file@attachmentsId": ["https://example.com/files/file4.pdf", "https://example.com/files/file5.pdf", "https://example.com/files/file6.pdf"]
                }
            }
        ]
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
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "files",
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
            }
        })
    ]
});

describe("object storage converter - single object with multiple objects with nested object with multiple file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with multiple file child to and from storage", async () => {
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

