import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useFruitManageHandler } from "../testHelpers/useFruitManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("fieldValidations", () => {
    const manageOpts = { path: "manage" };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["fruit"]
        });
    });

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

    /**
     * testing required, minLength and maxLength of the string
     */
    it(`should return error when validating "name" field`, async () => {
        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [minLengthResponse] = await createFruit({
            data: {
                values: {
                    ...defaultFruitData,
                    name: "t"
                }
            }
        });

        expect(minLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
                values: {
                    ...defaultFruitData,
                    name: "testing really long name"
                }
            }
        });

        expect(maxLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
    it(`should return error when validating "numbers" field`, async () => {
        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [minLengthResponse] = await createFruit({
            data: {
                values: {
                    ...defaultFruitData,
                    numbers: [4]
                }
            }
        });

        expect(minLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
                values: {
                    ...defaultFruitData,
                    numbers: [4, 5, 6, 7, 8, 9, 10, 11, 12]
                }
            }
        });

        expect(maxLengthResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
                values: {
                    ...defaultFruitData,
                    numbers: [1, 2, 3, 4]
                }
            }
        });

        expect(gteResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
                values: {
                    ...defaultFruitData,
                    numbers: [5, 6, 7, 16]
                }
            }
        });

        expect(lteResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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
    it.each(emailPatternTestValues)(
        `should return error when validating "email" field with a pattern - %s`,
        async email => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        email
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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
    it.each(urlPatternTestValues)(
        `should return error when validating "url" field with a pattern - %s`,
        async url => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        url
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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
    it.each(lowerCaseTestValues)(
        `should return error when validating "lowerCase" field - %s`,
        async lowerCase => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        lowerCase
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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
    it.each(upperCaseTestValues)(
        `should return error when validating "upperCase" field - %s`,
        async upperCase => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        upperCase
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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

    it.each(dateErrorValidations)(
        `should return error when validating "date" field - %s`,
        async (date, message) => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        date
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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

    it.each(dateTimeErrorValidations)(
        `should return error when validating "dateTime" field - %s`,
        async (dateTime, message) => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        dateTime: new Date(dateTime).toISOString()
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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

    it.each(dateTimeZErrorValidations)(
        `should return error when validating "dateTimeZ" field - %s`,
        async (dateTimeZ, message) => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        dateTimeZ
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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

    it.each(timeErrorValidations)(
        `should return error when validating "time" field - %s`,
        async (time, message) => {
            const { createFruit } = useFruitManageHandler({
                ...manageOpts
            });

            const [response] = await createFruit({
                data: {
                    values: {
                        ...defaultFruitData,
                        time
                    }
                }
            });

            expect(response).toEqual({
                data: {
                    createFruit: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "Cms/Entry/ValidationError",
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

    it("should return error when slug already exists", async () => {
        const { createFruit } = useFruitManageHandler({
            ...manageOpts
        });
        /**
         * Should create first fruit without any problems.
         */
        const [createResponse] = await createFruit({
            data: {
                values: defaultFruitData
            }
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
            data: {
                values: defaultFruitData
            }
        });

        expect(createAgainResponse).toEqual({
            data: {
                createFruit: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
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

    it("should create a fruit without validation errors", async () => {
        const { createFruit, getFruit } = useFruitManageHandler({
            ...manageOpts
        });

        const [createResponse] = await createFruit({
            data: {
                values: {
                    ...defaultFruitData
                }
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
                        meta: {
                            locked: false,
                            modelId: "fruit",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    values: {
                                        name: defaultFruitData.name
                                    }
                                }
                            ],
                            status: "draft",
                            title: defaultFruitData.name,
                            version: 1
                        },
                        values: {
                            email: defaultFruitData.email,
                            lowerCase: defaultFruitData.lowerCase,
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
                        }
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
                        meta: {
                            locked: false,
                            modelId: "fruit",
                            revisions: [
                                {
                                    id: apple.id,
                                    values: {
                                        name: defaultFruitData.name
                                    }
                                }
                            ],
                            status: "draft",
                            title: defaultFruitData.name,
                            version: 1
                        },
                        values: {
                            email: defaultFruitData.email,
                            lowerCase: defaultFruitData.lowerCase,
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
                        }
                    },
                    error: null
                }
            }
        });
    });
});
