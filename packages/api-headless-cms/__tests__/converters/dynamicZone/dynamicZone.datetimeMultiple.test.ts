import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../mocks/model.js";
import { createModelField } from "../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../__helpers/converters.js";

const plainValue = {
    content: {
        _templateId: "datetimeTemplate",
        milestones: ["2026-02-06T10:30:00Z", "2026-02-06T14:00:00Z", "2026-02-06T18:00:00Z"]
    }
};
const convertedValue = {
    "dynamicZone@contentId": {
        _templateId: "datetimeTemplate",
        "datetime@milestonesId": [
            "2026-02-06T10:30:00Z",
            "2026-02-06T14:00:00Z",
            "2026-02-06T18:00:00Z"
        ]
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "content",
            type: "dynamicZone",
            list: false,
            settings: {
                templates: [
                    {
                        id: "datetimeTemplate",
                        name: "Datetime Template",
                        gqlTypeName: "DatetimeTemplate",
                        icon: undefined,
                        description: "",
                        fields: [
                            createModelField({
                                fieldId: "milestones",
                                type: "datetime",
                                list: true
                            })
                        ],
                        layout: [],
                        validation: []
                    }
                ]
            }
        })
    ]
});

describe("dynamicZone storage converter - single dynamic zone with multiple datetime template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single dynamic zone with multiple datetime template to and from storage", async () => {
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
