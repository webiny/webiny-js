import { createContextHandler } from "./contextHandler";
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

    beforeEach(() => {
        delete process.env["WEBINY_MAILER_PASSWORD_SECRET"];
    });

    it("should not be possible to get or save settings without secret", async () => {
        expect.assertions(4);
        const context = await handle();

        try {
            await context.mailer.getSettings();
        } catch (ex) {
            expect(ex.message).toEqual("There must be a password secret defined!");
        }

        try {
            await context.mailer.createSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There must be a password secret defined!");
        }

        try {
            await context.mailer.updateSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There must be a password secret defined!");
        }

        try {
            await context.mailer.saveSettings({
                input: {}
            });
        } catch (ex) {
            expect(ex.message).toEqual("There must be a password secret defined!");
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
            port: 25,
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
            port: 25,
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
                port: 30,
                host: "dummy-host2.webiny"
            },
            original: settings
        });

        expect(response).toEqual({
            ...input,
            port: 30,
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
            port: 30,
            host: "dummy-host3.webiny",
            password: ""
        });
    });

    it("should be possible to update settings without password", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        await context.mailer.createSettings({
            input
        });

        const settings = await context.mailer.getSettings();

        const removedPasswordInput: Partial<typeof input> = {
            ...input
        };
        delete removedPasswordInput["password"];

        const response = await context.mailer.updateSettings({
            input: {
                ...input,
                port: 25,
                host: "dummy-host2.webiny"
            },
            original: settings
        });

        expect(response).toEqual({
            ...input,
            port: 25,
            host: "dummy-host2.webiny",
            password: ""
        });

        const afterUpdate = await context.mailer.getSettings();

        expect(afterUpdate).toEqual({
            ...settings,
            password: input.password,
            host: "dummy-host2.webiny"
        });
    });

    it("should be possible to access settings when no permissions", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const fullCtx = await handle();

        await fullCtx.mailer.createSettings({
            input
        });

        const { handle: noAccessHandle } = createContextHandler({
            permissions: []
        });

        const context = await noAccessHandle();

        const response = await context.mailer.getSettings();

        expect(response).toEqual({
            ...input,
            port: 25,
            id: expect.any(String)
        });
    });

    it("should not be possible to create or update settings due to no permissions", async () => {
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";

        const { handle: noAccessHandle } = createContextHandler({
            permissions: []
        });

        const context = await noAccessHandle();

        let createResponse: any = null;
        let createError: any = null;

        try {
            createResponse = await context.mailer.createSettings({
                input
            });
        } catch (ex) {
            createError = {
                message: ex.message,
                code: ex.code,
                data: ex.data
            };
        }

        expect(createResponse).toEqual(null);
        expect(createError).toEqual({
            message: "Not authorized!",
            code: "SECURITY_NOT_AUTHORIZED",
            data: {
                reason: "Not allowed to update the mailer settings."
            }
        });

        let updateResponse: any = null;
        let updateError: any = null;

        try {
            updateResponse = await context.mailer.updateSettings({
                input
            });
        } catch (ex) {
            updateError = {
                message: ex.message,
                code: ex.code,
                data: ex.data
            };
        }

        expect(updateResponse).toEqual(null);
        expect(updateError).toEqual({
            message: "Not authorized!",
            code: "SECURITY_NOT_AUTHORIZED",
            data: {
                reason: "Not allowed to update the mailer settings."
            }
        });
    });
});
