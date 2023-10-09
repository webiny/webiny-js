import { createValidationStructure } from "~tests/contentAPI/cmsEntryValidation/mocks/structure";
import { useValidationManageHandler } from "~tests/contentAPI/cmsEntryValidation/handler";
import {
    createDateField,
    createNumberField,
    createTextField,
    createTimeField
} from "./mocks/fields";

describe("content entry picked validation", () => {
    it("should execute validations which are not skipped - required", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "RequiredTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [requiredResponse] = await manager.create({
            data: {}
        });
        expect(requiredResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Value is required.",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
        expect(requiredResponse.data.create.error.data).toHaveLength(1);

        const [noRequiredResponse] = await manager.create({
            data: {},
            options: {
                skipValidators: ["required"]
            }
        });
        expect(noRequiredResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - min length", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "MinLengthTesting",
            fields: [
                createTextField({
                    validation: [
                        {
                            name: "minLength",
                            message: "minLengthError",
                            settings: {
                                value: 10
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [minLengthResponse] = await manager.create({
            data: {
                title: "abc"
            }
        });
        expect(minLengthResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "minLengthError",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
        expect(minLengthResponse.data.create.error.data).toHaveLength(1);
        const [noMinLengthResponse] = await manager.create({
            data: {
                title: "abc"
            },
            options: {
                skipValidators: ["minLength"]
            }
        });
        expect(noMinLengthResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - max length", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "MaxLengthTesting",
            fields: [
                createTextField({
                    validation: [
                        {
                            name: "maxLength",
                            message: "maxLengthError",
                            settings: {
                                value: 20
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [maxLengthResponse] = await manager.create({
            data: {
                title: "abcdefghijklmnopqrstabcdefghijklmnopqrst"
            }
        });
        expect(maxLengthResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "maxLengthError",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
        expect(maxLengthResponse.data.create.error.data).toHaveLength(1);
        const [noMaxLengthResponse] = await manager.create({
            data: {
                title: "abcdefghijklmnopqrstabcdefghijklmnopqrst"
            },
            options: {
                skipValidators: ["maxLength"]
            }
        });
        expect(noMaxLengthResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - pattern", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "PatternTesting",
            fields: [
                createTextField({
                    validation: [
                        {
                            name: "pattern",
                            message: "patternError",
                            settings: {
                                regex: /^r2d3r4d5r6d7$/,
                                flags: "i",
                                preset: "custom"
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [patternResponse] = await manager.create({
            data: {
                title: "r2d3r4d5r6d8"
            }
        });
        expect(patternResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "patternError",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
        expect(patternResponse.data.create.error.data).toHaveLength(1);

        const [noPatternResponse] = await manager.create({
            data: {
                title: "r2d3r4d5r6d8"
            },
            options: {
                skipValidators: ["pattern"]
            }
        });
        expect(noPatternResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - in", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "InTesting",
            fields: [
                createTextField({
                    validation: [
                        {
                            name: "in",
                            message: "inError",
                            settings: {
                                values: ["red", "black", "blue"]
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [inResponse] = await manager.create({
            data: {
                title: "green"
            }
        });
        expect(inResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "inError",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
        expect(inResponse.data.create.error.data).toHaveLength(1);

        const [noInResponse] = await manager.create({
            data: {
                title: "green"
            },
            options: {
                skipValidators: ["in"]
            }
        });
        expect(noInResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - lte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "LteTesting",
            fields: [
                createNumberField({
                    validation: [
                        {
                            name: "lte",
                            message: "Value must be greater than or equal to 55.",
                            settings: {
                                value: 55
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [gteResponse] = await manager.create({
            data: {
                price: 56
            }
        });
        expect(gteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Value must be greater than or equal to 55.",
                                fieldId: "price",
                                id: "price",
                                parents: [],
                                storageId: "number@price"
                            }
                        ]
                    }
                }
            }
        });
        expect(gteResponse.data.create.error.data).toHaveLength(1);

        const [noGteResponse] = await manager.create({
            data: {
                price: 56
            },
            options: {
                skipValidators: ["lte"]
            }
        });
        expect(noGteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - gte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "GteTesting",
            fields: [createNumberField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [gteResponse] = await manager.create({
            data: {
                price: 0
            }
        });
        expect(gteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Value must be greater than or equal to 1.",
                                fieldId: "price",
                                id: "price",
                                parents: [],
                                storageId: "number@price"
                            }
                        ]
                    }
                }
            }
        });
        expect(gteResponse.data.create.error.data).toHaveLength(1);

        const [noGteResponse] = await manager.create({
            data: {
                price: 0
            },
            options: {
                skipValidators: ["gte"]
            }
        });
        expect(noGteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - date lte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "DateLteTesting",
            fields: [createDateField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [dateLteResponse] = await manager.create({
            data: {
                releaseDate: "2024-01-01"
            }
        });
        expect(dateLteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Date must be lesser than or equal to 2023-12-31.",
                                fieldId: "releaseDate",
                                id: "releaseDate",
                                parents: [],
                                storageId: "datetime@releaseDate"
                            }
                        ]
                    }
                }
            }
        });
        expect(dateLteResponse.data.create.error.data).toHaveLength(1);

        const [noDateLteResponse] = await manager.create({
            data: {
                releaseDate: "2024-01-01"
            },
            options: {
                skipValidators: ["dateLte"]
            }
        });
        expect(noDateLteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - date gte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "DateGteTesting",
            fields: [createDateField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [dateGteResponse] = await manager.create({
            data: {
                releaseDate: "2019-01-01"
            }
        });
        expect(dateGteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Date must be greater than or equal to 2020-01-01.",
                                fieldId: "releaseDate",
                                id: "releaseDate",
                                parents: [],
                                storageId: "datetime@releaseDate"
                            }
                        ]
                    }
                }
            }
        });
        expect(dateGteResponse.data.create.error.data).toHaveLength(1);

        const [noDateGteResponse] = await manager.create({
            data: {
                releaseDate: "2019-01-01"
            },
            options: {
                skipValidators: ["dateGte"]
            }
        });
        expect(noDateGteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - time lte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "TimeLteTesting",
            fields: [
                createTimeField({
                    validation: [
                        {
                            name: "timeLte",
                            message: `Time must be lesser than or equal to 05:05.`,
                            settings: {
                                value: "05:05"
                            }
                        }
                    ]
                })
            ]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [timeLteResponse] = await manager.create({
            data: {
                runningTime: "05:06"
            }
        });
        expect(timeLteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Time must be lesser than or equal to 05:05.",
                                fieldId: "runningTime",
                                id: "runningTime",
                                parents: [],
                                storageId: "datetime@runningTime"
                            }
                        ]
                    }
                }
            }
        });
        expect(timeLteResponse.data.create.error.data).toHaveLength(1);

        const [noTimeLteResponse] = await manager.create({
            data: {
                runningTime: "05:06"
            },
            options: {
                skipValidators: ["timeLte"]
            }
        });
        expect(noTimeLteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should execute validations which are not skipped - time gte", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "TimeGteTesting",
            fields: [createTimeField()]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [timeGteResponse] = await manager.create({
            data: {
                runningTime: "00:29"
            }
        });
        expect(timeGteResponse).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Time must be greater than or equal to 00:30.",
                                fieldId: "runningTime",
                                id: "runningTime",
                                parents: [],
                                storageId: "datetime@runningTime"
                            }
                        ]
                    }
                }
            }
        });
        expect(timeGteResponse.data.create.error.data).toHaveLength(1);

        const [noTimeGteResponse] = await manager.create({
            data: {
                runningTime: "00:29"
            },
            options: {
                skipValidators: ["timeGte"]
            }
        });
        expect(noTimeGteResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });
    it("should skip validation on update and create from", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "UpdateTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [createResponse] = await manager.create({
            data: {},
            options: {
                skipValidators: ["required"]
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const { id, entryId } = createResponse.data.create.data;
        const [updateResponse] = await manager.update({
            revision: id,
            data: {},
            options: {
                skipValidators: ["required"]
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                update: {
                    data: {
                        id
                    },
                    error: null
                }
            }
        });

        const [createFromResponse] = await manager.createRevision({
            revision: id,
            data: {},
            options: {
                skipValidators: ["required"]
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createRevision: {
                    data: {
                        id: `${entryId}#0002`
                    },
                    error: null
                }
            }
        });
    });

    it("should execute validation on publish and return an error", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "UpdateTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage/en-US",
            plugins,
            model
        });
        const [createResponse] = await manager.create({
            data: {},
            options: {
                skipValidators: ["required"]
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [publishResponse] = await manager.publish({
            revision: createResponse.data.create.data.id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publish: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Value is required.",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
    });
});
