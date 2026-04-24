import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "fileTemplate",
        avatar: "https://example.com/files/avatar.jpg"
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "fileTemplate",
        "file@avatarId": "https://example.com/files/avatar.jpg"
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            list: false,
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
                                fieldId: "avatar",
                                type: "file",
                                list: false
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

describe("dynamicZone storage converter - single dynamic zone with file template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with file template to and from storage", async () => {
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
