import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            _templateId: "jsonTemplate",
            metadata: { theme: "dark", layout: "grid", columns: 3 }
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "jsonTemplate",
            "json@metadataId": { theme: "dark", layout: "grid", columns: 3 }
        }
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
                        fieldId: "content",
                        type: "dynamicZone",
                        list: false,
                        settings: {
                            templates: [
                                {
                                    id: "jsonTemplate",
                                    name: "JSON Template",
                                    gqlTypeName: "JsonTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "metadata",
                                            type: "json",
                                            list: false
                                        })
                                    ],
                                    layout: [],
                                    validation: []
                                }
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - single object with dynamic zone with json template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with dynamic zone with json template to and from storage", async () => {
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
