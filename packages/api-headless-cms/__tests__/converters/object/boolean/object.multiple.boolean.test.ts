import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    settingsList: [
        {
            isActive: true
        },
        {
            isActive: false
        },
        {
            isActive: true
        }
    ]
};
const convertedValue = {
    "object@settingsListId": [
        {
            "boolean@isActiveId": true
        },
        {
            "boolean@isActiveId": false
        },
        {
            "boolean@isActiveId": true
        }
    ]
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "settingsList",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "isActive",
                        type: "boolean",
                        multipleValues: false
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - multiple object with single boolean child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert multiple object field with single boolean child to and from storage", async () => {
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
