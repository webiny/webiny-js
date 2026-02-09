import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        content: {
            _templateId: "refTemplate",
            relatedPosts: [
                {
                    id: "post1#0001",
                    entryId: "post1",
                    modelId: "post"
                },
                {
                    id: "post2#0001",
                    entryId: "post2",
                    modelId: "post"
                },
                {
                    id: "post3#0001",
                    entryId: "post3",
                    modelId: "post"
                }
            ]
        }
    }
};
const convertedValue = {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "refTemplate",
            "ref@relatedPostsId": [
                {
                    id: "post1#0001",
                    entryId: "post1",
                    modelId: "post"
                },
                {
                    id: "post2#0001",
                    entryId: "post2",
                    modelId: "post"
                },
                {
                    id: "post3#0001",
                    entryId: "post3",
                    modelId: "post"
                }
            ]
        }
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
                        fieldId: "content",
                        type: "dynamicZone",
                        multipleValues: false,
                        settings: {
                            templates: [
                                {
                                    id: "refTemplate",
                                    name: "Ref Template",
                                    gqlTypeName: "RefTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "relatedPosts",
                                            type: "ref",
                                            multipleValues: true
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

describe("object storage converter - single object with dynamic zone with multiple ref template", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with dynamic zone with multiple ref template to and from storage", async () => {
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
