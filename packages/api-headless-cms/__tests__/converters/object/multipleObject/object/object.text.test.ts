import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        contacts: [
            {
                info: {
                    name: "John Doe"
                }
            },
            {
                info: {
                    name: "Jane Smith"
                }
            },
            {
                info: {
                    name: "Bob Johnson"
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@contactsId": [
            {
                "object@infoId": {
                    "text@nameId": "John Doe"
                }
            },
            {
                "object@infoId": {
                    "text@nameId": "Jane Smith"
                }
            },
            {
                "object@infoId": {
                    "text@nameId": "Bob Johnson"
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
                        fieldId: "contacts",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "info",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "name",
                                                type: "text",
                                                multipleValues: false
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

describe("object storage converter - single object with multiple objects with nested object with text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with text child to and from storage", async () => {
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
