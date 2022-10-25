import { createGraphQLHandler } from "./graphQLHandler";

jest.mock("nodemailer", () => {
    return {
        createTransport: () => {
            throw new Error("Transport should not be created at this point.");
        }
    };
});

describe("Mailer Settings GraphQL", () => {
    const handler = createGraphQLHandler();

    beforeEach(() => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";
    });

    it("should fetch settings and there should be nothing in it", async () => {
        const [response] = await handler.getSettings();

        expect(response).toEqual({
            data: {
                mailer: {
                    getSettings: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });

    it("should save settings and then fetch", async () => {
        const [firstSaveResponse] = await handler.saveSettings({
            data: {
                host: "dummy-host.webiny",
                user: "user",
                password: "password",
                from: "from@dummy-host.webiny",
                replyTo: "replyTo@dummy-host.webiny"
            }
        });

        expect(firstSaveResponse).toEqual({
            data: {
                mailer: {
                    saveSettings: {
                        data: {
                            from: "from@dummy-host.webiny",
                            host: "dummy-host.webiny",
                            replyTo: "replyTo@dummy-host.webiny",
                            user: "user"
                        },
                        error: null
                    }
                }
            }
        });

        const [response] = await handler.getSettings();

        expect(response).toEqual({
            data: {
                mailer: {
                    getSettings: {
                        data: {
                            from: "from@dummy-host.webiny",
                            host: "dummy-host.webiny",
                            replyTo: "replyTo@dummy-host.webiny",
                            user: "user"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * We change some data in second save
         */
        const [secondSaveResponse] = await handler.saveSettings({
            data: {
                host: "dummy-host2.webiny",
                user: "user2",
                password: "passwordNew",
                from: "from2@dummy-host.webiny",
                replyTo: "replyTo2@dummy-host.webiny"
            }
        });

        expect(secondSaveResponse).toEqual({
            data: {
                mailer: {
                    saveSettings: {
                        data: {
                            host: "dummy-host2.webiny",
                            user: "user2",
                            from: "from2@dummy-host.webiny",
                            replyTo: "replyTo2@dummy-host.webiny"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * And in third save, we do not send the password into the api.
         */
        const [thirdSaveResponse] = await handler.saveSettings({
            data: {
                host: "dummy-host3.webiny",
                user: "user3",
                from: "from3@dummy-host.webiny",
                replyTo: "replyTo3@dummy-host.webiny"
            }
        });
        expect(thirdSaveResponse).toEqual({
            data: {
                mailer: {
                    saveSettings: {
                        data: {
                            host: "dummy-host3.webiny",
                            user: "user3",
                            from: "from3@dummy-host.webiny",
                            replyTo: "replyTo3@dummy-host.webiny"
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should not be possibly to get or save settings when no secret is available", async () => {
        delete process.env.WEBINY_MAILER_PASSWORD_SECRET;

        const [getResponse] = await handler.getSettings();

        expect(getResponse).toEqual({
            data: {
                mailer: {
                    getSettings: {
                        data: null,
                        error: {
                            data: {
                                description:
                                    "To store the Mailer settings, you must have a password secret environment variable defined."
                            },
                            message: "There must be a password secret defined!",
                            code: "PASSWORD_SECRET_ERROR"
                        }
                    }
                }
            }
        });

        const [saveResponse] = await handler.saveSettings({
            data: {
                host: "dummy-host.webiny",
                user: "user",
                password: "password",
                from: "from@dummy-host.webiny",
                replyTo: "replyTo@dummy-host.webiny"
            }
        });

        expect(saveResponse).toEqual({
            data: {
                mailer: {
                    saveSettings: {
                        data: null,
                        error: {
                            data: {
                                description:
                                    "To store the Mailer settings, you must have a password secret environment variable defined."
                            },
                            message: "There must be a password secret defined!",
                            code: "PASSWORD_SECRET_ERROR"
                        }
                    }
                }
            }
        });
    });

    it("should not have access to saving settings", async () => {
        const noAccessHandler = createGraphQLHandler({
            permissions: []
        });
        const [response] = await noAccessHandler.saveSettings({
            data: {
                host: "dummy-host.webiny",
                user: "user",
                password: "password",
                from: "from@dummy-host.webiny",
                replyTo: "replyTo@dummy-host.webiny"
            }
        });

        expect(response).toEqual({
            data: {
                mailer: {
                    saveSettings: {
                        data: null,
                        error: {
                            code: "SECURITY_NOT_AUTHORIZED",
                            data: {
                                reason: "Not allowed to update the mailer settings."
                            },
                            message: "Not authorized!"
                        }
                    }
                }
            }
        });
    });
});
