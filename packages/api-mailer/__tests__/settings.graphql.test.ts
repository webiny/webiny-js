import { createGraphQLHandler } from "./createGraphQLHandler";

jest.mock("nodemailer", () => {
    return {
        createTransport: () => {
            const message = "Transport should not be created at this point.";
            console.log("Transport should not be created at this point.");
            throw new Error(message);
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
    });
});
