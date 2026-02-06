import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "fileTemplate",
        attachments: ["https://example.com/files/file1.pdf", "https://example.com/files/file2.pdf", "https://example.com/files/file3.pdf"]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "fileTemplate",
        "file@attachmentsId": ["https://example.com/files/file1.pdf", "https://example.com/files/file2.pdf", "https://example.com/files/file3.pdf"]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            multipleValues: false,
            settings: {
                templates: [
                    {
                        id: "fileTemplate",
                        name: "File Template",
                        gqlTypeName: "FileTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "attachments",
                                type: "file",
                                multipleValues: true
                            })
                        ],
                        layout: [],
                        validation: []
                    }
                ]
            }
        })
    ]
});

describe("dynamicZone storage converter - single dynamic zone with multiple file template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with multiple file template to and from storage", async () => {
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

