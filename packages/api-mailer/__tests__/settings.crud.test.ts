import { createContextHandler } from "./createContextHandler";
import { TransportSendData } from "~/types";

jest.mock("nodemailer", () => {
    return {
        createTransport: () => {
            return {
                sendMail: async (params: TransportSendData) => {
                    return {
                        envelope: "envelope",
                        messageId: "123",
                        accepted: [params.to],
                        rejected: [],
                        pending: [],
                        response: "ok"
                    };
                }
            };
        }
    };
});

describe("Settings Transporter CRUD", () => {
    const { handle } = createContextHandler();

    it("should not be possible to get or save settings without secret", async () => {
        expect.assertions(4);
        const context = await handle();

        try {
            await context.mailer.getSettings();
        } catch (ex) {
            expect(ex.message).toEqual("There is no password secret defined.");
        }

        try {
            await context.mailer.createSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There is no password secret defined.");
        }

        try {
            await context.mailer.updateSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There is no password secret defined.");
        }

        try {
            await context.mailer.saveSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There is no password secret defined.");
        }
    });

    const input = {
        host: "dummy-host.webiny",
        user: "user",
        password: "someReallyComplexPasswordWithNumbers1234",
        from: "from@dummy-host.webiny",
        replyTo: "replyTo@dummy-host.webiny"
    };

    it("should not return response with password when creating settings", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        const response = await context.mailer.createSettings({
            input
        });

        expect(response).toEqual({
            ...input,
            password: ""
        });
    });

    it("should return response with password when getting settings", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        await context.mailer.createSettings({
            input
        });

        const settings = await context.mailer.getSettings();

        expect(settings).toEqual({
            ...input,
            id: expect.any(String)
        });
    });

    it("should not return response with password when updating settings", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        await context.mailer.createSettings({
            input
        });

        const settings = await context.mailer.getSettings();

        const response = await context.mailer.updateSettings({
            input: {
                ...input,
                host: "dummy-host2.webiny"
            },
            original: settings
        });

        expect(response).toEqual({
            ...input,
            host: "dummy-host2.webiny",
            password: ""
        });

        const responseWithNoOriginal = await context.mailer.updateSettings({
            input: {
                ...input,
                host: "dummy-host3.webiny"
            }
        });

        expect(responseWithNoOriginal).toEqual({
            ...input,
            host: "dummy-host3.webiny",
            password: ""
        });
    });
});
