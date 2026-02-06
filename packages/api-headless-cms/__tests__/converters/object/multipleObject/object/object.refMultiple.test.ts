import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../../mocks/model.js";
import { createModelField } from "../../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../../__helpers/converters.js";

const plainValue = {
    profile: {
        relations: [
            {
                refs: {
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
                        }
                    ]
                }
            },
            {
                refs: {
                    relatedPosts: [
                        {
                            id: "post3#0001",
                            entryId: "post3",
                            modelId: "post"
                        }
                    ]
                }
            },
            {
                refs: {
                    relatedPosts: [
                        {
                            id: "post4#0001",
                            entryId: "post4",
                            modelId: "post"
                        },
                        {
                            id: "post5#0001",
                            entryId: "post5",
                            modelId: "post"
                        },
                        {
                            id: "post6#0001",
                            entryId: "post6",
                            modelId: "post"
                        }
                    ]
                }
            }
        ]
    }
};
const convertedValue = {
    "object@profileId": {
        "object@relationsId": [
            {
                "object@refsId": {
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
                        }
                    ]
                }
            },
            {
                "object@refsId": {
                    "ref@relatedPostsId": [
                        {
                            id: "post3#0001",
                            entryId: "post3",
                            modelId: "post"
                        }
                    ]
                }
            },
            {
                "object@refsId": {
                    "ref@relatedPostsId": [
                        {
                            id: "post4#0001",
                            entryId: "post4",
                            modelId: "post"
                        },
                        {
                            id: "post5#0001",
                            entryId: "post5",
                            modelId: "post"
                        },
                        {
                            id: "post6#0001",
                            entryId: "post6",
                            modelId: "post"
                        }
                    ]
                }
            }
        ]
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
                        fieldId: "relations",
                        type: "object",
                        multipleValues: true,
                        settings: {
                            fields: [
                                createModelField({
                                    fieldId: "refs",
                                    type: "object",
                                    multipleValues: false,
                                    settings: {
                                        fields: [
                                            createModelField({
                                                fieldId: "relatedPosts",
                                                type: "ref",
                                                multipleValues: true
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

describe("object storage converter - single object with multiple objects with nested object with multiple ref child", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert single object with multiple objects with nested object with multiple ref child to and from storage", async () => {
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

