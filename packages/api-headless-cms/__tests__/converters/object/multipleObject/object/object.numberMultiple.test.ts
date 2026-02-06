import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            stats: {
                scores: [85, 92]
            }
        },
        {
            stats: {
                scores: [78, 88, 95]
            }
        },
        {
            stats: {
                scores: [90]
            }
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "object@statsId": {
                "number@scoresId": [85, 92]
            }
        },
        {
            "object@statsId": {
                "number@scoresId": [78, 88, 95]
            }
        },
        {
            "object@statsId": {
                "number@scoresId": [90]
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
                        fieldId: "stats",
                        type: "object",
                        multipleValues: false,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "scores",
                                    type: "number",
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

describe("object storage converter - multiple objects with single nested object with multiple number child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single nested object with multiple number child to and from storage", async () => {
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

