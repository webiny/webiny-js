import useGqlHandler from "./useGqlHandler";
import { assignLifecycleEvents, lifecycleTracker } from "./mocks/lifecycleEvents";

const WEBINY_VERSION = process.env.WEBINY_VERSION;

enum LocaleLifecycle {
    BEFORE_CREATE = "locale:beforeCreate",
    AFTER_CREATE = "locale:afterCreate",
    BEFORE_UPDATE = "locale:beforeUpdate",
    AFTER_UPDATE = "locale:afterUpdate",
    BEFORE_DELETE = "locale:beforeDelete",
    AFTER_DELETE = "locale:afterDelete"
}

const localeData = {
    default: true,
    code: "hr-HR"
};

const expectedLocaleData = {
    ...localeData,
    createdBy: {
        id: "12345678",
        type: "admin",
        displayName: "John Doe"
    },
    createdOn: expect.stringMatching(/^20/)
};

describe("Locale lifecycle events", () => {
    const { createI18NLocale, updateI18NLocale, deleteI18NLocale } = useGqlHandler({
        plugins: [assignLifecycleEvents()]
    });
    const hookParamsExpected = {
        createdOn: expect.stringMatching(/^20/),
        createdBy: expectedLocaleData.createdBy,
        tenant: "root",
        code: "hr-HR",
        webinyVersion: WEBINY_VERSION
    };

    beforeEach(() => {
        lifecycleTracker.reset();
    });

    test(`it should call "beforeCreate" and "afterCreate" methods`, async () => {
        const [createResponse] = await createI18NLocale({ data: localeData });
        /**
         * We expect that locale was created.
         */
        expect(createResponse).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: expectedLocaleData,
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_CREATE)).toEqual(1);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_CREATE)).toEqual(1);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_DELETE)).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeCreate: any = lifecycleTracker.getLast(LocaleLifecycle.BEFORE_CREATE);
        expect(beforeCreate.params[0]).toEqual({
            context: expect.any(Object),
            locale: {
                ...localeData,
                ...hookParamsExpected
            },
            tenant: "root"
        });
        const afterCreate: any = lifecycleTracker.getLast(LocaleLifecycle.AFTER_CREATE);
        expect(afterCreate.params[0]).toEqual({
            context: expect.any(Object),
            locale: {
                ...localeData,
                ...hookParamsExpected
            },
            tenant: "root"
        });
    });

    test(`it should call "beforeUpdate" and "afterUpdate" methods`, async () => {
        const [hrHrResponse] = await createI18NLocale({ data: localeData });
        expect(hrHrResponse).toMatchObject({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            ...localeData
                        },
                        error: null
                    }
                }
            }
        });
        const [enUsResponse] = await createI18NLocale({
            data: {
                code: "en-US",
                default: false
            }
        });
        expect(enUsResponse).toMatchObject({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "en-US",
                            default: false
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * After the creation of two locales we expect that create lifecycle methods were triggered.
         */
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_CREATE)).toEqual(2);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_CREATE)).toEqual(2);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_DELETE)).toEqual(0);
        lifecycleTracker.reset();

        const [updateResponse] = await updateI18NLocale({
            code: "en-US",
            data: {
                default: true
            }
        });
        expect(updateResponse).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: {
                            ...expectedLocaleData,
                            code: "en-US"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Only update lifecycle methods should have been triggered.
         */
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_CREATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_CREATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_UPDATE)).toEqual(1);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_UPDATE)).toEqual(1);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_DELETE)).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeUpdate: any = lifecycleTracker.getLast(LocaleLifecycle.BEFORE_UPDATE);
        expect(beforeUpdate.params[0]).toEqual({
            context: expect.any(Object),
            original: {
                ...localeData,
                ...hookParamsExpected,
                default: false,
                code: "en-US"
            },
            locale: {
                ...localeData,
                ...hookParamsExpected,
                code: "en-US"
            },
            tenant: "root"
        });
        const afterUpdate: any = lifecycleTracker.getLast(LocaleLifecycle.AFTER_UPDATE);
        expect(afterUpdate.params[0]).toEqual({
            context: expect.any(Object),
            original: {
                ...localeData,
                ...hookParamsExpected,
                default: false,
                code: "en-US"
            },
            locale: {
                ...localeData,
                ...hookParamsExpected,
                code: "en-US"
            },
            tenant: "root"
        });
    });

    test(`it should call "beforeDelete" and "afterDelete" methods`, async () => {
        await createI18NLocale({ data: localeData });
        await createI18NLocale({
            data: {
                ...localeData,
                code: "en-US",
                default: false
            }
        });

        const [deleteResponse] = await deleteI18NLocale({
            code: "en-US"
        });
        expect(deleteResponse).toEqual({
            data: {
                i18n: {
                    deleteI18NLocale: {
                        data: {
                            ...expectedLocaleData,
                            default: false,
                            code: "en-US"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_CREATE)).toEqual(2);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_CREATE)).toEqual(2);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.BEFORE_DELETE)).toEqual(1);
        expect(lifecycleTracker.getExecuted(LocaleLifecycle.AFTER_DELETE)).toEqual(1);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeDelete: any = lifecycleTracker.getLast(LocaleLifecycle.BEFORE_DELETE);
        expect(beforeDelete.params[0]).toEqual({
            context: expect.any(Object),
            locale: {
                ...localeData,
                ...hookParamsExpected,
                default: false,
                code: "en-US"
            },
            tenant: "root"
        });
        const afterDelete: any = lifecycleTracker.getLast(LocaleLifecycle.AFTER_DELETE);
        expect(afterDelete.params[0]).toEqual({
            context: expect.any(Object),
            locale: {
                ...localeData,
                ...hookParamsExpected,
                default: false,
                code: "en-US"
            },
            tenant: "root"
        });
    });
});
