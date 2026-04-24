import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "./mocks/model.js";
import { createModelField } from "./mocks/field.js";
import { getConverters, type IConvertersResponse } from "./__helpers/converters.js";

const plainValue = {
    timestamps: ["2026-02-06T10:30:00Z", "2026-02-07T14:45:00Z", "2026-02-08T09:15:00Z"]
};
const convertedValue = {
    "datetime@timestampsId": [
        "2026-02-06T10:30:00Z",
        "2026-02-07T14:45:00Z",
        "2026-02-08T09:15:00Z"
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "timestamps",
            type: "datetime",
            list: true
        })
    ]
});

describe("datetime storage converter", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple datetime field value to and from storage", async () => {
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
