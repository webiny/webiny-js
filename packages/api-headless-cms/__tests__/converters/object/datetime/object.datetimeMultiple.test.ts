import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    event: {
        milestones: ["2026-02-06T10:30:00Z", "2026-02-07T14:45:00Z", "2026-02-08T09:15:00Z"]
    }
};
const convertedValue = {
    "object@eventId": {
        "datetime@milestonesId": [
            "2026-02-06T10:30:00Z",
            "2026-02-07T14:45:00Z",
            "2026-02-08T09:15:00Z"
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "event",
            type: "object",
            list: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "milestones",
                        type: "datetime",
                        list: true
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with multiple datetime child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert object field with multiple datetime child to and from storage", async () => {
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
