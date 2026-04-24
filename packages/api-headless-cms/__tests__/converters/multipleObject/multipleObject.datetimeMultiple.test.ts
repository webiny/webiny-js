import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            milestones: ["2026-02-06T10:30:00Z", "2026-02-06T14:00:00Z"]
        },
        {
            milestones: ["2026-02-07T09:00:00Z", "2026-02-07T16:30:00Z"]
        },
        {
            milestones: ["2026-02-08T08:15:00Z"]
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "datetime@milestonesId": ["2026-02-06T10:30:00Z", "2026-02-06T14:00:00Z"]
        },
        {
            "datetime@milestonesId": ["2026-02-07T09:00:00Z", "2026-02-07T16:30:00Z"]
        },
        {
            "datetime@milestonesId": ["2026-02-08T08:15:00Z"]
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profiles",
            type: "object",
            list: true,
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

describe("object storage converter - multiple objects with multiple datetime child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with multiple datetime child to and from storage", async () => {
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
