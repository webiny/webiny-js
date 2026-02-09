import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        timelines: [
            {
                dates: {
                    createdAt: "2026-02-06T10:30:00Z"
                }
            },
            {
                dates: {
                    createdAt: "2026-02-07T14:45:00Z"
                }
            },
            {
                dates: {
                    createdAt: "2026-02-08T09:15:00Z"
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@timelinesId": [
            {
                "object@datesId": {
                    "datetime@createdAtId": "2026-02-06T10:30:00Z"
                }
            },
            {
                "object@datesId": {
                    "datetime@createdAtId": "2026-02-07T14:45:00Z"
                }
            },
            {
                "object@datesId": {
                    "datetime@createdAtId": "2026-02-08T09:15:00Z"
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
                        fieldId: "timelines",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "dates",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "createdAt",
                                                type: "datetime",
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

describe("object storage converter - single object with multiple objects with nested object with datetime child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with datetime child to and from storage", async () => {
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
