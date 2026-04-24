import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        timelines: [
            {
                events: [
                    {
                        createdAt: "2026-02-06T10:30:00Z"
                    },
                    {
                        createdAt: "2026-02-07T14:45:00Z"
                    }
                ]
            },
            {
                events: [
                    {
                        createdAt: "2026-02-08T09:15:00Z"
                    }
                ]
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@timelinesId": [
            {
                "object@eventsId": [
                    {
                        "datetime@createdAtId": "2026-02-06T10:30:00Z"
                    },
                    {
                        "datetime@createdAtId": "2026-02-07T14:45:00Z"
                    }
                ]
            },
            {
                "object@eventsId": [
                    {
                        "datetime@createdAtId": "2026-02-08T09:15:00Z"
                    }
                ]
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
                        fieldId: "timelines",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "events",
                                    type: "object",
                                    list: true,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "createdAt",
                                                type: "datetime",
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

describe("object storage converter - single object with multiple objects with multiple nested objects with datetime child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with multiple nested objects with datetime child to and from storage", async () => {
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
