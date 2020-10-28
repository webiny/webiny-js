import useGqlHandler from "./useGqlHandler";

describe("getI18NInformation Test", () => {
    const { createI18NLocale, getI18NInformation } = useGqlHandler();

    test("must return correct I18N information based on received headers", async () => {
        await createI18NLocale({ data: { code: "en-US", default: true } });
        await createI18NLocale({ data: { code: "en-GB", default: true } });
        await createI18NLocale({ data: { code: "hr-HR", default: true } });

        let [response] = await getI18NInformation();

        expect(response).toEqual({
            data: {
                i18n: {
                    getI18NInformation: {
                        currentLocales: [
                            {
                                context: "default",
                                locale: {
                                    code: "hr-HR",
                                    default: true
                                }
                            },
                            {
                                context: "content",
                                locale: {
                                    code: "hr-HR",
                                    default: true
                                }
                            }
                        ],
                        defaultLocale: {
                            code: "hr-HR",
                            default: true
                        },
                        locales: [
                            {
                                code: "en-GB",
                                default: false
                            },
                            {
                                code: "en-US",
                                default: false
                            },
                            {
                                code: "hr-HR",
                                default: true
                            }
                        ]
                    }
                }
            }
        });

        [response] = await getI18NInformation(null, {
            headers: {
                "accept-language": "en-GB,en;q=0.9,hr-HR;q=0.8,hr;q=0.7,en-US;q=0.6"
            }
        });

        expect(response).toMatchObject({
            data: {
                i18n: {
                    getI18NInformation: {
                        currentLocales: [
                            {
                                context: "default",
                                locale: {
                                    code: "en-GB",
                                    default: false
                                }
                            },
                            {
                                context: "content",
                                locale: {
                                    code: "en-GB",
                                    default: false
                                }
                            }
                        ]
                    }
                }
            }
        });

        [response] = await getI18NInformation(null, {
            headers: {
                "accept-language": "en-GB,en;q=0.9,hr-HR;q=0.8,hr;q=0.7,en-US;q=0.6",
                "x-i18n-locale-default": "en-US",
                "x-i18n-locale-content": "en-GB",
            }
        });

        expect(response).toMatchObject({
            data: {
                i18n: {
                    getI18NInformation: {
                        currentLocales: [
                            {
                                context: "default",
                                locale: {
                                    code: "en-US",
                                    default: false
                                }
                            },
                            {
                                context: "content",
                                locale: {
                                    code: "en-GB",
                                    default: false
                                }
                            }
                        ]
                    }
                }
            }
        });

        [response] = await getI18NInformation(null, {
            headers: {
                "accept-language": "en-GB,en;q=0.9,hr-HR;q=0.8,hr;q=0.7,en-US;q=0.6",
                "x-i18n-locale-default": "it-IT",
                "x-i18n-locale-content": "ru",
            }
        });

        expect(response).toMatchObject({
            data: {
                i18n: {
                    getI18NInformation: {
                        currentLocales: [
                            {
                                context: "default",
                                locale: {
                                    code: "hr-HR",
                                    default: true
                                }
                            },
                            {
                                context: "content",
                                locale: {
                                    code: "hr-HR",
                                    default: true
                                }
                            }
                        ]
                    }
                }
            }
        });
    });
});
