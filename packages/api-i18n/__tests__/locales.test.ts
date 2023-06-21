    import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const { createI18NLocale, updateI18NLocale, deleteI18NLocale, listI18NLocales, getI18NLocale } =
        useGqlHandler();
    const identity = {
        id: "12345678",
        type: "admin",
        displayName: "John Doe"
    };

    test("should create a single locale", async () => {
        const [createResponse] = await createI18NLocale({
            data: {
                code: "en-US",
                default: true
            }
        });

        expect(createResponse).toEqual({
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

        const [response] = await listI18NLocales();

        expect(response).toEqual({
            data: {
                i18n: {
                    listI18NLocales: {
                        data: [
                            {
                                code: "en-US",
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
    });

    test("create, read, update and delete locales", async () => {
        const [createResponseUs] = await createI18NLocale({
            data: { code: "en-US", default: true }
        });

        /**
         * Let's create few locales
         */
        expect(createResponseUs).toEqual({
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

        const [createResponseGb] = await createI18NLocale({
            data: { code: "en-GB", default: true }
        });
        expect(createResponseGb).toEqual({
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

        const [createResponseHrHr] = await createI18NLocale({
            data: { code: "hr-HR", default: true }
        });

        expect(createResponseHrHr).toEqual({
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
        const [createResponseHr] = await createI18NLocale({ data: { code: "hr", default: false } });

        expect(createResponseHr).toEqual({
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

        /**
         * List should show four locales.
         */
        const [listResponse] = await listI18NLocales();
        expect(listResponse).toEqual({
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
                            },
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
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // We should also be able to get the locale directly by providing the code.
        const [getGbResponse] = await getI18NLocale({ code: "en-GB" });
        expect(getGbResponse).toEqual({
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

        const [getHrHrResponse] = await getI18NLocale({ code: "hr-HR" });
        expect(getHrHrResponse).toEqual({
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
        const [deleteUsResponse] = await deleteI18NLocale({ code: "en-US" });
        expect(deleteUsResponse).toEqual({
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

        const [deleteGbResponse] = await deleteI18NLocale({ code: "en-GB" });
        expect(deleteGbResponse).toEqual({
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
        const [deleteHrHr] = await deleteI18NLocale({ code: "hr-HR" });
        expect(deleteHrHr).toEqual({
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
        const [listAfterDeleteResponse] = await listI18NLocales();
        expect(listAfterDeleteResponse).toEqual({
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
        const [setDefaultResponse] = await updateI18NLocale({
            code: "hr",
            data: { default: true }
        });
        expect(setDefaultResponse).toEqual({
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
        const [afterSetDefaultResponse] = await getI18NLocale({ code: "hr-HR" });
        expect(afterSetDefaultResponse).toEqual({
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
        const [listAfterDefaultResponse] = await listI18NLocales();
        expect(listAfterDefaultResponse).toEqual({
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
        const [createResponse] = await createI18NLocale({ data: { code: "hr", default: true } });
        expect(createResponse).toEqual({
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
        const [updateUnsetResponse] = await updateI18NLocale({
            code: "hr",
            data: { default: false }
        });
        expect(updateUnsetResponse).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: null,
                        error: {
                            code: "CANNOT_CHANGE_DEFAULT_LOCALE",
                            data: {
                                input: expect.any(Object),
                                original: expect.any(Object)
                            },
                            message:
                                "Cannot unset default locale, please set another locale as default first."
                        }
                    }
                }
            }
        });

        // Create a locale without default
        const [createNoDefaultResponse] = await createI18NLocale({ data: { code: "de-De" } });
        expect(createNoDefaultResponse).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            code: "de-De",
                            default: false,
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            }
        });

        // Update newly created locale as "default"
        const [updateAsDefaultResponse] = await updateI18NLocale({
            code: "de-De",
            data: { default: true }
        });
        expect(updateAsDefaultResponse).toEqual({
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
        const [response] = await listI18NLocales();
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
