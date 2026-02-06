import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            content: {
                description: "First profile with a long text description."
            }
        },
        {
            content: {
                description: "Second profile with detailed information."
            }
        },
        {
            content: {
                description: "Third profile with comprehensive content."
            }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "object@contentId": {
                "long-text@descriptionId": "First profile with a long text description."
            }
        },
        {
            "object@contentId": {
                "long-text@descriptionId": "Second profile with detailed information."
            }
        },
        {
            "object@contentId": {
                "long-text@descriptionId": "Third profile with comprehensive content."
            }
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "content",
                        type: "object",
                        multipleValues: false,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "description",
                                    type: "long-text",
                                    multipleValues: false
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single nested object with long-text child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single nested object with long-text child to and from storage", async () => {
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

