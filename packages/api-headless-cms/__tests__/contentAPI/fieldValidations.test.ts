import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup, CmsModel } from "~/types";
import models from "./mocks/contentModels";
import { useFruitManageHandler } from "../testHelpers/useFruitManageHandler";

describe("fieldValidations", () => {
    const manageOpts = { path: "manage/en-US" };

    const { createContentModelMutation, createContentModelGroupMutation } =
        useGraphQLHandler(manageOpts);

    const defaultFruitData = {
        name: "Apple",
        numbers: [5, 6, 7.2, 10.18, 12.05],
        email: "john@doe.com",
        url: "https://webiny.com",
        lowerCase: "lowercase",
        upperCase: "UPPERCASE",
        date: "2020-12-15",
        dateTime: new Date("2020-12-15T12:12:21").toISOString(),
        dateTimeZ: "2020-12-15T14:52:41+01:00",
        time: "13:29:58",
        /**
         * unique field
         */
        slug: "apple"
    };

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
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

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: contentModelGroup.id,
                fields: model.fields,
                layout: model.layout
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        } else if (create.data.createContentModel.error) {
            console.error(`[beforeEach] ${create.data.createContentModel.error.message}`);
            process.exit(1);
        }

        return create.data.createContentModel.data;
    };
    const setupContentModels = async (contentModelGroup: CmsGroup) => {
        const models: Record<string, CmsModel> = {
            fruit: null as unknown as CmsModel
        };
        for (const name in models) {
            models[name] = await setupContentModel(contentModelGroup, name);
        }
        return models;
    };

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
                                id: "name",
                                storageId: expect.stringMatching("text@"),
                                error: "Min length is 2.",
                                parents: []
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
                                id: "name",
                                storageId: expect.stringMatching("text@"),
                                error: "Max length is 15.",
                                parents: []
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
                                id: "numbers",
                                storageId: expect.stringMatching("number@"),
                                error: "Numbers must contain at least 2 items.",
                                parents: []
                            }
                        ]
                    }
                }
            }
        });

        const [maxLengthResponse] = await createFruit({
            data: {
                ...defaultFruitData,
                numbers: [4, 5, 6, 7, 8, 9, 10, 11, 12]
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
                                id: "numbers",
                                storageId: expect.stringMatching("number@"),
                                error: "Numbers can contain at most 7 items.",
                                parents: []
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
                                id: "numbers",
                                storageId: expect.stringMatching("number@"),
                                error: "Number must be greater or equal 5.",
                                parents: []
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
                                id: "numbers",
                                storageId: expect.stringMatching("number@"),
                                error: "Number be less or equal 15.",
                                parents: []
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
        `should return error when validating "email" field with a pattern - %s`,
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
                                    id: "email",
                                    storageId: expect.stringMatching("text@"),
                                    error: "Must be in a form of an email.",
                                    parents: []
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
        `should return error when validating "url" field with a pattern - %s`,
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
                                    id: "url",
                                    storageId: expect.stringMatching("text@"),
                                    error: "Must be in a form of a url.",
                                    parents: []
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
        `should return error when validating "lowerCase" field - %s`,
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
                                    id: "lowerCase",
                                    storageId: expect.stringMatching("text@"),
                                    error: "Everything must be lowercase.",
                                    parents: []
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
        `should return error when validating "upperCase" field - %s`,
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
                                    id: "upperCase",
                                    storageId: expect.stringMatching("text@"),
                                    error: "Everything must be uppercase.",
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const dateErrorValidations = [
        ["2020-11-30", "Date must be greater or equal than 2020-12-01"],
        ["2021-01-01", "Date must be lesser or equal than 2020-12-31"]
    ];

    test.each(dateErrorValidations)(
        `should return error when validating "date" field - %s`,
        async (date, message) => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    date
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
                                    fieldId: "date",
                                    id: "date",
                                    storageId: expect.stringMatching("datetime@"),
                                    error: message,
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const dateTimeErrorValidations = [
        ["2020-11-30 11:30:00", "Date must be greater or equal than 2020-12-01 11:30:00"],
        ["2021-01-01 14:30:00", "Date must be lesser or equal than 2020-12-31 13:30:00"]
    ];

    test.each(dateTimeErrorValidations)(
        `should return error when validating "dateTime" field - %s`,
        async (dateTime, message) => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    dateTime: new Date(dateTime).toISOString()
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
                                    fieldId: "dateTime",
                                    id: "dateTime",
                                    storageId: expect.stringMatching("datetime@"),
                                    error: message,
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const dateTimeZErrorValidations = [
        [
            "2020-11-30T11:30:00+01:00",
            "Date must be greater or equal than 2020-12-01T11:30:00+0100"
        ],
        ["2021-01-01T14:30:00+01:00", "Date must be lesser or equal than 2020-12-31T13:30:00+0100"]
    ];

    test.each(dateTimeZErrorValidations)(
        `should return error when validating "dateTimeZ" field - %s`,
        async (dateTimeZ, message) => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    dateTimeZ
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
                                    fieldId: "dateTimeZ",
                                    id: "dateTimeZ",
                                    storageId: expect.stringMatching("datetime@"),
                                    error: message,
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    const timeErrorValidations = [
        ["10:30:00", "Time must be greater or equal than 11:30:00"],
        ["14:30:00", "Time must be lesser or equal than 13:30:00"]
    ];

    test.each(timeErrorValidations)(
        `should return error when validating "time" field - %s`,
        async (time, message) => {
            const group = await setupContentModelGroup();
            await setupContentModels(group);

            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    ...defaultFruitData,
                    time
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
                                    fieldId: "time",
                                    id: "time",
                                    storageId: expect.stringMatching("datetime@"),
                                    error: message,
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            });
        }
    );

    test("should return error when slug already exists", async () => {
        const group = await setupContentModelGroup();
        await setupContentModels(group);

        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });
        /**
         * Should create first fruit without any problems.
         */
        const [createResponse] = await createFruit({
            data: defaultFruitData
        });

        expect(createResponse).toEqual({
            data: {
                createFruit: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        /**
         * Should fail on creating another fruit with same slug.
         */
        const [createAgainResponse] = await createFruit({
            data: defaultFruitData
        });

        expect(createAgainResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "slug",
                                id: "slug",
                                error: "Field value must be unique.",
                                storageId: "text@slug",
                                parents: []
                            }
                        ]
                    }
                }
            }
        });
    });

    test("should create a fruit without validation errors", async () => {
        const group = await setupContentModelGroup();
        await setupContentModels(group);

        const { createFruit, getFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [createResponse] = await createFruit({
            data: {
                ...defaultFruitData
            }
        });

        expect(createResponse).toEqual({
            data: {
                createFruit: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        modifiedOn: null,
                        savedOn: expect.stringMatching(/^20/),
                        firstPublishedOn: null,
                        lastPublishedOn: null,
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        email: defaultFruitData.email,
                        lowerCase: defaultFruitData.lowerCase,
                        meta: {
                            locked: false,
                            modelId: "fruit",
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
                        url: defaultFruitData.url,
                        time: defaultFruitData.time,
                        date: defaultFruitData.date,
                        dateTime: defaultFruitData.dateTime,
                        dateTimeZ: defaultFruitData.dateTimeZ,
                        rating: null,
                        isSomething: null,
                        description: null,
                        slug: "apple"
                    },
                    error: null
                }
            }
        });

        const apple = createResponse.data.createFruit.data;
        // make sure that numbers were correctly inserted and parsed -> returned
        const [response] = await getFruit({
            revision: apple.id
        });

        expect(response).toEqual({
            data: {
                getFruit: {
                    data: {
                        id: apple.id,
                        entryId: apple.entryId,
                        createdOn: apple.createdOn,
                        modifiedOn: null,
                        savedOn: apple.savedOn,
                        firstPublishedOn: null,
                        lastPublishedOn: null,
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        email: defaultFruitData.email,
                        lowerCase: defaultFruitData.lowerCase,
                        meta: {
                            locked: false,
                            modelId: "fruit",
                            revisions: [
                                {
                                    id: apple.id,
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
                        url: defaultFruitData.url,
                        time: defaultFruitData.time,
                        date: defaultFruitData.date,
                        dateTime: defaultFruitData.dateTime,
                        dateTimeZ: defaultFruitData.dateTimeZ,
                        rating: null,
                        isSomething: null,
                        description: null,
                        slug: "apple"
                    },
                    error: null
                }
            }
        });
    });
});
