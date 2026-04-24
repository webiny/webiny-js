import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        media: [
            {
                files: {
                    avatar: "https://example.com/files/avatar1.jpg"
                }
            },
            {
                files: {
                    avatar: "https://example.com/files/avatar2.jpg"
                }
            },
            {
                files: {
                    avatar: "https://example.com/files/avatar3.jpg"
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
                    "file@avatarId": "https://example.com/files/avatar1.jpg"
                }
            },
            {
                "object@filesId": {
                    "file@avatarId": "https://example.com/files/avatar2.jpg"
                }
            },
            {
                "object@filesId": {
                    "file@avatarId": "https://example.com/files/avatar3.jpg"
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
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "media",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "files",
                                    type: "object",
                                    list: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "avatar",
                                                type: "file",
                                                list: false
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

describe("object storage converter - single object with multiple objects with nested object with file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with file child to and from storage", async () => {
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
