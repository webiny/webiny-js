import { useValidationManageHandler } from "./handler";
import ucFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { createValidationStructure } from "./mocks/structure";
import {
    createBooleanField,
    createDateField,
    createDateTimeField,
    createDynamicZoneField,
    createFileField,
    createLongTextField,
    createNumberField,
    createObjectField,
    createReferenceField,
    createRichTextField,
    createTextField,
    createTimeField
} from "./mocks/fields";
import { createError, createFieldErrors, isNestedError } from "./mocks/errors";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";
import { CmsModel } from "~/types";

describe("content entry validation", () => {
    /**
     * Single field per test
     */
    const constructs: [string, any][] = [
        ["boolean", createBooleanField],
        ["date", createDateField],
        ["dateTime", createDateTimeField],
        ["dynamicZone", createDynamicZoneField],
        ["file", createFileField],
        ["long-text", createLongTextField],
        ["number", createNumberField],
        ["object", createObjectField],
        ["reference", createReferenceField],
        ["rich-text", createRichTextField],
        ["text", createTextField],
        ["time", createTimeField]
    ];
    // boolean
    it.each(constructs)(
        "should return error for invalid %s field - single value",
        async (name, fn) => {
            const field = fn();
            const { plugins, model } = createValidationStructure({
                modelId: `testingSingleValue${ucFirst(camelCase(name))}`,
                singularApiName: `TestingSingleValues${ucFirst(camelCase(name))}`,
                pluralApiName: `TestingSingleValues${ucFirst(camelCase(name))}`,
                fields: [field]
            });
            const manager = useValidationManageHandler({
                path: "manage/en-US",
                plugins,
                model
            });
            const [response] = await manager.validate({
                data: {}
            });
            expect(response).toEqual({
                data: {
                    validate: {
                        data: [createError(field)],
                        error: null
                    }
                }
            });
        }
    );
    it.each(constructs)(
        "should return error for invalid %s field - multiple values",
        async (name, fn) => {
            const field = fn({
                multipleValues: true
            });
            const { plugins, model } = createValidationStructure({
                modelId: `testingMultipleValue${ucFirst(camelCase(name))}`,
                singularApiName: `TestingMultipleValues${ucFirst(camelCase(name))}`,
                pluralApiName: `TestingMultipleValues${ucFirst(camelCase(name))}`,
                fields: [field]
            });
            const manager = useValidationManageHandler({
                path: "manage/en-US",
                plugins,
                model
            });
            const [response] = await manager.validate({
                data: {}
            });
            const error = createError(field);
            expect(response).toEqual({
                data: {
                    validate: {
                        data: [error],
                        error: null
                    }
                }
            });
        }
    );
    /**
     * All fields.
     */
    it("should return errors for invalid entry", async () => {
        const { plugins, model } = createValidationStructure();
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [response] = await manager.validate({
            data: {}
        });

        /**
         * Remove all dz and nested fields.
         */
        const expectedErrors = createFieldErrors(model.fields).filter(error => {
            return !isNestedError(error);
        });

        expect(response).toEqual({
            data: {
                validate: {
                    data: expectedErrors,
                    error: null
                }
            }
        });
        /**
         * Count all the fields and reduce the number for all the objects and the dynamic zones.
         */
        expect(response.data.validate.data).toHaveLength(expectedErrors.length);
    });

    it("should return errors for array not having any items", async () => {
        const field = createTextField({
            multipleValues: true
        });
        const { plugins, model } = createValidationStructure({
            modelId: `testingEmptyArrayValues`,
            singularApiName: `TestingEmptyArrayValues`,
            pluralApiName: `TestingEmptyArrayValues`,
            fields: [field]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [response] = await manager.validate({
            data: {
                [field.fieldId]: []
            }
        });

        expect(response).toEqual({
            data: {
                validate: {
                    data: [createError(field)],
                    error: null
                }
            }
        });
    });

    it("should return errors for invalid field - nested and dynamic zone", async () => {
        const { plugins, model } = createValidationStructure();

        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [response] = await manager.validate({
            data: {
                nested: {},
                dz: {
                    Hero: {
                        dzNested: {}
                    }
                }
            }
        });

        /**
         * We need to remove nested, dz and nestedDz as they are populated.
         */
        const expectedErrors = createFieldErrors(model.fields).filter(error => {
            return !["nested", "dz", "dzNested"].includes(error.fieldId);
        });

        expect(response).toEqual({
            data: {
                validate: {
                    data: expectedErrors,
                    error: null
                }
            }
        });
        /**
         * Count all the fields and reduce the number for all the objects and the dynamic zones.
         */
        expect(response.data.validate.data).toHaveLength(expectedErrors.length);
    });

    it("should return errors for invalid dynamic zone field values", async () => {
        const { plugins, model } = createValidationStructure({
            ...(pageModel as CmsModel)
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [response] = await manager.validate({
            data: {
                content: [
                    {
                        Hero: {},
                        SimpleText: {},
                        Objecting: {
                            nestedObject: {
                                objectNestedObject: [
                                    {
                                        nestedObjectNestedTitle: null
                                    }
                                ]
                            }
                        }
                    },
                    {
                        Hero: {
                            title: "ok hero 2"
                        },
                        SimpleText: {},
                        Objecting: {
                            nestedObject: {
                                objectNestedObject: [
                                    {
                                        nestedObjectNestedTitle: "ok 1"
                                    }
                                ]
                            }
                        }
                    }
                ],
                header: {
                    TextHeader: {}
                },
                objective: {
                    Objecting: {
                        nestedObject: {
                            objectNestedObject: [
                                {
                                    nestedObjectNestedTitle: "ok"
                                },
                                {
                                    nestedObjectNestedTitle: null
                                },
                                {
                                    nestedObjectNestedTitle: "ok 2"
                                }
                            ]
                        }
                    }
                }
            }
        });

        expect(response).toEqual({
            data: {
                validate: {
                    data: [
                        createError({
                            error: "Value is required.",
                            id: "dwodev6q",
                            fieldId: "title",
                            parents: ["content", "0", "Hero"]
                        }),
                        createError({
                            error: `"nestedObject.objectTitle" is required.`,
                            id: "rt3uhvds",
                            fieldId: "objectTitle",
                            parents: ["content", "0", "Objecting", "nestedObject"]
                        }),
                        createError({
                            error: '"nestedObject.objectNestedObject.nestedObjectNestedTitle" is required.',
                            fieldId: "nestedObjectNestedTitle",
                            id: "g9huerprgds",
                            parents: [
                                "content",
                                "0",
                                "Objecting",
                                "nestedObject",
                                "objectNestedObject",
                                "0"
                            ]
                        }),
                        createError({
                            error: `"nestedObject.objectTitle" is required.`,
                            fieldId: "objectTitle",
                            id: "rt3uhvds",
                            parents: ["content", "1", "Objecting", "nestedObject"]
                        }),
                        createError({
                            error: `"nestedObjectNestedTitle" is required.`,
                            fieldId: "nestedObjectNestedTitle",
                            id: "hpgtierghpiue",
                            parents: [
                                "objective",
                                "Objecting",
                                "nestedObject",
                                "objectNestedObject",
                                "1"
                            ]
                        })
                    ],
                    error: null
                }
            }
        });
    });

    it("should not return errors for valid entry", async () => {
        const { plugins, model } = createValidationStructure();
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [response] = await manager.validate({
            data: {
                title: "text test",
                enabled: true,
                price: 2,
                description: "long-text test",
                body: [
                    {
                        type: "h1",
                        content: "rich text test"
                    }
                ],
                releaseDate: "2021-01-01",
                runningTime: "22:45",
                xyzPublishedOn: "2023-01-01T00:00:00.000+00:00",
                image: "https://webiny.com/image.png",
                category: {
                    id: "category-1",
                    modelId: "category"
                },
                nested: {
                    nestedTitle: "nested text test",
                    nestedEnabled: false,
                    nestedPrice: 3,
                    nestedDescription: "nested long-text test",
                    nestedBody: [
                        {
                            type: "h2",
                            content: "nested rich text test"
                        }
                    ],
                    nestedReleaseDate: "2022-01-01",
                    nestedRunningTime: "23:55",
                    nestedXyzPublishedOn: "2022-01-01T00:00:00.000+02:00",
                    nestedImage: "https://webiny.com/image2.png",
                    nestedCategory: {
                        id: "category-2",
                        modelId: "category"
                    }
                },
                dz: {
                    Hero: {
                        dzTitle: "dz text test",
                        dzEnabled: false,
                        dzPrice: 4,
                        dzDescription: "dz long-text test",
                        dzBody: [
                            {
                                type: "h2",
                                content: "dz rich text test"
                            }
                        ],
                        dzReleaseDate: "2021-01-01",
                        dzRunningTime: "21:55",
                        dzXyzPublishedOn: "2021-01-01T00:00:00.000+02:00",
                        dzImage: "https://webiny.com/image2.png",
                        dzCategory: {
                            id: "category-3",
                            modelId: "category"
                        },
                        dzNested: {
                            dzNestedTitle: "dzNested text test",
                            dzNestedEnabled: false,
                            dzNestedPrice: 4,
                            dzNestedDescription: "dzNested long-text test",
                            dzNestedBody: [
                                {
                                    type: "h2",
                                    content: "dzNested rich text test"
                                }
                            ],
                            dzNestedReleaseDate: "2021-01-01",
                            dzNestedRunningTime: "21:55",
                            dzNestedXyzPublishedOn: "2021-01-01T00:00:00.000+02:00",
                            dzNestedImage: "https://webiny.com/image2.png",
                            dzNestedCategory: {
                                id: "category-4",
                                modelId: "category"
                            }
                        }
                    }
                },
                // multiple values
                multiValueTitle: "text test",
                multiValueEnabled: false,
                multiValuePrice: 4,
                multiValueDescription: "long-text test",
                multiValueBody: [
                    {
                        type: "h2",
                        content: "rich text test"
                    }
                ],
                multiValueReleaseDate: "2021-01-01",
                multiValueRunningTime: "21:55",
                multiValueXyzPublishedOn: "2021-01-01T00:00:00.000+02:00",
                multiValueImage: "https://webiny.com/image2.png",
                multiValueCategory: {
                    id: "category-11",
                    modelId: "category"
                }
            }
        });

        expect(response).toEqual({
            data: {
                validate: {
                    data: [],
                    error: null
                }
            }
        });
        expect(response.data.validate.data).toHaveLength(0);
    });
});
