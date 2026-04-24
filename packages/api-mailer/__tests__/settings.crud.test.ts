import { describe, it, expect, beforeEach, vi } from "vitest";
import { createContextHandler } from "./contextHandler";
import { GetSettingsUseCase } from "~/features/GetSettings/index.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/index.js";
import { TransportSendData } from "~/types";

vi.mock("nodemailer", () => {
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
        delete process.env["WEBINY_API_MAILER_PASSWORD_SECRET"];
    });

    // TODO: @bruno - the `catch` block is no longer triggered
    it.skip("should not be possible to get or save settings without secret", async () => {
        expect.assertions(2);
        const context = await handle();

        try {
            const getSettings = context.container.resolve(GetSettingsUseCase);
            await getSettings.execute();
        } catch (ex) {
            expect(ex.message).toEqual("There must be a password secret defined!");
        }

        try {
            const saveSettings = context.container.resolve(SaveSettingsUseCase);
            await saveSettings.execute({
                host: "test",
                user: "test",
                from: "test@test.com"
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

    it("should not return response with password when saving settings", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const result = await saveSettings.execute(input);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            ...input,
            port: 25,
            password: ""
        });
    });

    it("should return response with password when getting settings", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        await saveSettings.execute(input);

        const getSettings = context.container.resolve(GetSettingsUseCase);
        const result = await getSettings.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            ...input,
            port: 25
        });
    });

    it("should not return response with password when updating settings", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        await saveSettings.execute(input);

        const updateResult = await saveSettings.execute({
            ...input,
            port: 30,
            host: "dummy-host2.webiny"
        });

        expect(updateResult.isOk()).toBe(true);
        expect(updateResult.value).toEqual({
            ...input,
            port: 30,
            host: "dummy-host2.webiny",
            password: ""
        });

        const updateResult2 = await saveSettings.execute({
            ...input,
            host: "dummy-host3.webiny"
        });

        expect(updateResult2.isOk()).toBe(true);
        expect(updateResult2.value).toEqual({
            ...input,
            port: 30,
            host: "dummy-host3.webiny",
            password: ""
        });
    });

    it("should be possible to update settings without password", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        await saveSettings.execute(input);

        const removedPasswordInput: Partial<typeof input> = {
            ...input
        };
        delete removedPasswordInput["password"];

        const updateResult = await saveSettings.execute({
            host: "dummy-host2.webiny",
            user: input.user,
            from: input.from,
            port: 25
        });

        expect(updateResult.isOk()).toBe(true);
        expect(updateResult.value).toEqual({
            ...input,
            port: 25,
            host: "dummy-host2.webiny",
            password: ""
        });

        const getSettings = context.container.resolve(GetSettingsUseCase);
        const afterUpdate = await getSettings.execute();

        expect(afterUpdate.isOk()).toBe(true);
        expect(afterUpdate.value).toEqual({
            ...input,
            password: input.password,
            port: 25,
            host: "dummy-host2.webiny"
        });
    });

    it("should be possible to access settings when no permissions", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const fullCtx = await handle();

        const saveSettings = fullCtx.container.resolve(SaveSettingsUseCase);
        await saveSettings.execute(input);

        const { handle: noAccessHandle } = createContextHandler({
            permissions: []
        });

        const context = await noAccessHandle();

        const getSettings = context.container.resolve(GetSettingsUseCase);
        const result = await getSettings.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            ...input,
            port: 25
        });
    });

    it("should not be possible to save settings due to no permissions", async () => {
        process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";

        const { handle: noAccessHandle } = createContextHandler({
            permissions: []
        });

        const context = await noAccessHandle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const saveResponse = await saveSettings.execute(input);

        expect(saveResponse.isFail()).toEqual(true);
        expect(saveResponse.error.code).toEqual("Mailer/Settings/NotAuthorized");
    });
});
