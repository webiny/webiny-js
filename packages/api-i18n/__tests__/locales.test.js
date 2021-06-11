import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const {
        createI18NLocale,
        updateI18NLocale,
        deleteI18NLocale,
        listI18NLocales,
        getI18NLocale
    } = useGqlHandler();
    const identity = {
        id: "admin@webiny.com",
        type: "admin",
        displayName: "John Doe"
    };

    test("create, read, update and delete locales", async () => {
        let [response] = await createI18NLocale({ data: { code: "en-US", default: true } });

        // Let's create two locales.
        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "en-US",
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },
                            {
                                code: "en-US",
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },
                            {
                                code: "hr",
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },

                            {
                                code: "hr-HR",
                                default: true,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
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
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
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
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },
                            {
                                code: "hr-HR",
                                default: true,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Update "non-default" locale as default
        [response] = await updateI18NLocale({ code: "hr", data: { default: true } });
        expect(response).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: {
                            code: "hr",
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            }
        });

        // Previously set "default" locale should not be "default now
        [response] = await getI18NLocale({ code: "hr-HR" });
        expect(response).toEqual({
            data: {
                i18n: {
                    getI18NLocale: {
                        data: {
                            code: "hr-HR",
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
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
                                default: true,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },
                            {
                                code: "hr-HR",
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`set and unset "default" locale`, async () => {
        // Create a "default" locale
        let [response] = await createI18NLocale({ data: { code: "hr", default: true } });
        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "hr",
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            }
        });

        // Trying to unset "default" for an existing locale should return error
        [response] = await updateI18NLocale({ code: "hr", data: { default: false } });
        expect(response).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message:
                                "Cannot unset default locale, please set another locale as default first."
                        }
                    }
                }
            }
        });

        // Create a locale without default
        [response] = await createI18NLocale({ data: { code: "de-De" } });
        expect(response).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "de-De",
                            default: null,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            }
        });

        // Update newly created locale as "default"
        [response] = await updateI18NLocale({ code: "de-De", data: { default: true } });
        expect(response).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: {
                            code: "de-De",
                            default: true,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            }
        });

        // Three locales should be returned here.
        [response] = await listI18NLocales();
        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "de-De",
                                default: true,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            },
                            {
                                code: "hr",
                                default: false,
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: identity
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
