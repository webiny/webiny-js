import useGqlHandler from "../useGqlHandler";
import originField from "../mocks/originField";
import { defaultIdentity } from "../tenancySecurity";

const localeData = {
    code: "hr-HR",
    default: true,
    origin: "Webiny"
};

const expectedLocaleData = {
    ...localeData,
    createdBy: defaultIdentity,
    createdOn: expect.stringMatching(/^20/)
};

describe("Locales crud", () => {
    const { createI18NLocale, updateI18NLocale } = useGqlHandler({
        plugins: [originField()]
    });

    test("it should write a string into a origin field", async () => {
        const [createResponse] = await createI18NLocale(
            {
                data: localeData
            },
            ["origin"]
        );

        expect(createResponse).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            ...expectedLocaleData
                        },
                        error: null
                    }
                }
            }
        });

        const [updateResponse] = await updateI18NLocale(
            {
                code: localeData.code,
                data: {
                    default: true,
                    origin: "web"
                }
            },
            ["origin"]
        );

        expect(updateResponse).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: {
                            ...expectedLocaleData,
                            origin: "web"
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("it should fail origin field validation", async () => {
        const [createFailedResponse] = await createI18NLocale(
            {
                data: {
                    ...localeData,
                    origin: "unknown"
                }
            },
            ["origin"]
        );

        expect(createFailedResponse).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: null,
                        error: {
                            message: "Origin must be set to one of: webiny, web.",
                            code: "LOCALE_CREATE_ERROR",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        await createI18NLocale(
            {
                data: localeData
            },
            ["origin"]
        );

        const [updateResponse] = await updateI18NLocale(
            {
                code: localeData.code,
                data: {
                    default: true,
                    origin: "unknown"
                }
            },
            ["origin"]
        );

        expect(updateResponse).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: null,
                        error: {
                            message: "Origin must be set to one of: webiny, web.",
                            code: "LOCALE_UPDATE_ERROR",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});
