import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentModelGroup } from "@webiny/api-headless-cms/types";
import models from "./mocks/contentModels";
import { useFruitManageHandler } from "../utils/useFruitManageHandler";

describe("fieldValidations", () => {
    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    const defaultFruitData = {
        name: "Apple",
        numbers: [5, 6, 7],
        email: "john@doe.com",
        url: "https://webiny.com",
        lowerCase: "lowercase",
        upperCase: "UPPERCASE"
    };

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsContentModelGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsContentModelGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        } else if (create.data.createContentModel.data.error) {
            console.error(`[beforeEach] ${create.data.createContentModel.data.error.message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };
    const setupContentModels = async (contentModelGroup: CmsContentModelGroup) => {
        const models = {
            fruit: null
        };
        for (const name in models) {
            models[name] = await setupContentModel(contentModelGroup, name);
        }
        return models;
    };

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
        } catch {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch {}
    });
    /**
     * testing required, minLength and maxLength of the string
     */
    test(`should return error when validating "name" field`, async () => {
        const group = await setupContentModelGroup();
        await setupContentModels(group);

        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [minLengthResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                name: "t"
            }
        });

        expect(minLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "name",
                                error: "Min length is 2."
                            }
                        ]
                    }
                }
            }
        });

        const [maxLengthResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                name: "testing really long name"
            }
        });

        expect(maxLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "name",
                                error: "Max length is 15."
                            }
                        ]
                    }
                }
            }
        });

        const [requiredResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                name: undefined
            }
        });

        expect(requiredResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "name",
                                error: "This field is required."
                            }
                        ]
                    }
                }
            }
        });
    });
    /**
     * testing minLength and maxLength of the array
     * testing required, gte and lte for each value in the array
     */
    test(`should return error when validating "numbers" field`, async () => {
        const group = await setupContentModelGroup();
        await setupContentModels(group);

        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [minLengthResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [4]
            }
        });

        expect(minLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "numbers",
                                error: "Numbers must contain at least 2 items."
                            }
                        ]
                    }
                }
            }
        });

        const [maxLengthResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [4, 5, 6, 7, 8, 9]
            }
        });

        expect(maxLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "numbers",
                                error: "Numbers can contain at most 4 items."
                            }
                        ]
                    }
                }
            }
        });

        const [gteResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [1, 2, 3, 4]
            }
        });

        expect(gteResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "numbers",
                                error: "Number must be greater or equal 5."
                            }
                        ]
                    }
                }
            }
        });

        const [lteResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [5, 6, 7, 16]
            }
        });

        expect(lteResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "numbers",
                                error: "Number be less or equal 15."
                            }
                        ]
                    }
                }
            }
        });

        const [requiredResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [5, 6, undefined, 15]
            }
        });

        expect(requiredResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "numbers",
                                error: "Number is required."
                            }
                        ]
                    }
                }
            }
        });
    });

    const emailPatternTestValues = [
        ["john"],
        ["john@"],
        ["john@doe"],
        ["@doe"],
        ["@"],
        ["jo.hn@doe"],
        ["joHn"],
        ["j0hN@"],
        ["j0hn@d0e"],
        ["@d0e"],
        ["j0.hn@d03"]
    ];
    /**
     * testing email pattern
     */
    test.each(emailPatternTestValues)(
        `should return error when validating "email" field with a pattern`,
        async email => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    email
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "VALIDATION_FAILED",
                            data: [
                                {
                                    fieldId: "email",
                                    error: "Must be in a form of an email."
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const urlPatternTestValues = [
        ["website"],
        ["http:website"],
        ["http:/website"],
        ["https:website"],
        ["https:/website"],
        ["ftp:/website"],
        ["ftp:/website"],
        ["http:192.168.0.1"],
        ["http:/192.168.0.1"],
        ["https:192.168.0.1"],
        ["https:/192.168.0.1"]
    ];
    /**
     * testing url pattern
     */
    test.each(urlPatternTestValues)(
        `should return error when validating "url" field with a pattern`,
        async url => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    url
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "VALIDATION_FAILED",
                            data: [
                                {
                                    fieldId: "url",
                                    error: "Must be in a form of a url."
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const lowerCaseTestValues = [
        ["nonLowerCase"],
        ["lowercasewithanumber1"],
        ["lowercasewith space"],
        ["ALLUPPERCASE"],
        ["lowercasewithdot."]
    ];
    /**
     * testing lowercase
     */
    test.each(lowerCaseTestValues)(
        `should return error when validating "lowerCase" field`,
        async lowerCase => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    lowerCase
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "VALIDATION_FAILED",
                            data: [
                                {
                                    fieldId: "lowerCase",
                                    error: "Everything must be lowercase."
                                }
                            ]
                        }
                    }
                }
            });
        }
    );
    const upperCaseTestValues = [
        ["nonUpperCase"],
        ["UPPERCASEWITHNUMBER1"],
        ["UPPERCASEWITH SPACE"],
        ["lowercase"],
        ["UPPERCASE."]
    ];
    /**
     * testing uppercase
     */
    test.each(upperCaseTestValues)(
        `should return error when validating "upperCase" field`,
        async upperCase => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    upperCase
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "VALIDATION_FAILED",
                            data: [
                                {
                                    fieldId: "upperCase",
                                    error: "Everything must be uppercase."
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    test("should create a fruit without validation errors", async () => {
        const group = await setupContentModelGroup();
        await setupContentModels(group);

        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [response] = await createFruit({
            data: {
                ...defaultFruitData
            }
        });

        expect(response).toEqual({
            data: {
                createFruit: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        email: defaultFruitData.email,
                        lowerCase: defaultFruitData.lowerCase,
                        meta: {
                            locked: false,
                            modelId: "fruit",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    name: defaultFruitData.name
                                }
                            ],
                            status: "draft",
                            title: defaultFruitData.name,
                            version: 1
                        },
                        name: defaultFruitData.name,
                        numbers: defaultFruitData.numbers,
                        upperCase: defaultFruitData.upperCase,
                        url: defaultFruitData.url
                    },
                    error: null
                }
            }
        });
    });
});
