import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    profiles: [
        {
            avatar: "https://example.com/files/avatar1.jpg"
        },
        {
            avatar: "https://example.com/files/avatar2.jpg"
        },
        {
            avatar: "https://example.com/files/avatar3.jpg"
        }
    ]
};
const convertedValue = {
    "object@profilesId": [
        {
            "file@avatarId": "https://example.com/files/avatar1.jpg"
        },
        {
            "file@avatarId": "https://example.com/files/avatar2.jpg"
        },
        {
            "file@avatarId": "https://example.com/files/avatar3.jpg"
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
                        fieldId: "avatar",
                        type: "file",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple objects with single file child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple objects with single file child to and from storage", async () => {
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
