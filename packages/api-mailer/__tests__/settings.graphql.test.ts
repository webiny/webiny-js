import { describe, it, expect, vi } from "vitest";
import { createGraphQLHandler } from "./graphQLHandler";

vi.mock("nodemailer", () => {
    return {
        createTransport: () => {
            throw new Error("Transport should not be created at this point.");
        }
    };
});

describe("Mailer Settings GraphQL", () => {
    const handler = createGraphQLHandler();

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
                            port: 587,
                            secure: false,
                            replyTo: "replyTo@dummy-host.webiny",
                            user: "user",
                            source: "storage"
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
                            port: 587,
                            secure: false,
                            replyTo: "replyTo@dummy-host.webiny",
                            user: "user",
                            source: "storage"
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
                            port: 587,
                            secure: false,
                            user: "user2",
                            from: "from2@dummy-host.webiny",
                            replyTo: "replyTo2@dummy-host.webiny",
                            source: "storage"
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
                            port: 587,
                            secure: false,
                            user: "user3",
                            from: "from3@dummy-host.webiny",
                            replyTo: "replyTo3@dummy-host.webiny",
                            source: "storage"
                        },
                        error: null
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
                            data: null,
                            code: "Mailer/Settings/NotAuthorized",
                            message: "Not allowed to update the mailer settings."
                        }
                    }
                }
            }
        });
    });
});
