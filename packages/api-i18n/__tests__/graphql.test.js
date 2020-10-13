import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const { createI18NLocale, deleteI18NLocale, listI18NLocales, getI18NLocale } = useGqlHandler();

    test("create, read, update and delete locales", async () => {
        let [response] = await createI18NLocale({ data: { code: "en-US", default: true } });

        // Let's create two locales.
        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "en-US",
                            default: true
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await createI18NLocale({ data: { code: "en-GB", default: true } });
        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "en-GB",
                            default: true
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await createI18NLocale({ data: { code: "hr-HR", default: true } });

        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "hr-HR",
                            default: true
                        },
                        error: null
                    }
                }
            }
        });

        // Try creating a locale with default not set as true.
        [response] = await createI18NLocale({ data: { code: "hr", default: false } });

        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "hr",
                            default: false
                        },
                        error: null
                    }
                }
            }
        });

        // List should show three locales.
        [response] = await listI18NLocales();
        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "en-GB",
                                default: false
                            },
                            {
                                code: "en-US",
                                default: false
                            },
                            {
                                code: "hr",
                                default: false
                            },

                            {
                                code: "hr-HR",
                                default: true
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's try searching using `codeBeginsWith` query operator.
        [response] = await listI18NLocales({ where: { codeBeginsWith: "en" } });
        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "en-GB",
                                default: false
                            },
                            {
                                code: "en-US",
                                default: false
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        [response] = await listI18NLocales({ where: { codeBeginsWith: "hr" } });
        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "hr",
                                default: false
                            },
                            {
                                code: "hr-HR",
                                default: true
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // We should also be able to get the locale directly by providing the code.
        [response] = await getI18NLocale({ code: "en-GB" });
        expect(response).toEqual({
            data: {
                i18n: {
                    getI18NLocale: {
                        data: {
                            code: "en-GB",
                            default: false
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await getI18NLocale({ code: "hr-HR" });
        expect(response).toEqual({
            data: {
                i18n: {
                    getI18NLocale: {
                        data: {
                            code: "hr-HR",
                            default: true
                        },
                        error: null
                    }
                }
            }
        });

        // After deleting two locales, list should return only 1 locale.
        [response] = await deleteI18NLocale({ code: "en-US" });
        expect(response).toEqual({
            data: {
                i18n: {
                    deleteI18NLocale: {
                        data: {
                            code: "en-US",
                            default: false
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await deleteI18NLocale({ code: "en-GB" });
        expect(response).toEqual({
            data: {
                i18n: {
                    deleteI18NLocale: {
                        data: {
                            code: "en-GB",
                            default: false
                        },
                        error: null
                    }
                }
            }
        });

        // We tried deleting the third locale, but we can't do that since it's the default one.
        [response] = await deleteI18NLocale({ code: "hr-HR" });
        expect(response).toEqual({
            data: {
                i18n: {
                    deleteI18NLocale: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message:
                                "Cannot delete default locale, please set another locale as default first."
                        }
                    }
                }
            }
        });

        // Two locales should be returned here.
        [response] = await listI18NLocales();
        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "hr",
                                default: false
                            },
                            {
                                code: "hr-HR",
                                default: true
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
