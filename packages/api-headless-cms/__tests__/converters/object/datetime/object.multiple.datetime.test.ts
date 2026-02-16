import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    events: [
        {
            scheduledAt: "2026-02-06T10:30:00Z"
        },
        {
            scheduledAt: "2026-02-07T14:45:00Z"
        },
        {
            scheduledAt: "2026-02-08T09:15:00Z"
        }
    ]
};
const convertedValue = {
    "object@eventsId": [
        {
            "datetime@scheduledAtId": "2026-02-06T10:30:00Z"
        },
        {
            "datetime@scheduledAtId": "2026-02-07T14:45:00Z"
        },
        {
            "datetime@scheduledAtId": "2026-02-08T09:15:00Z"
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "events",
            type: "object",
            list: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "scheduledAt",
                        type: "datetime",
                        list: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single datetime child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single datetime child to and from storage", async () => {
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
