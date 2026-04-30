import { describe, it, expect, beforeEach } from "vitest";
import { createContextPlugin } from "@webiny/api";
import { createContextHandler } from "./contextHandler";
import {
    SaveSettingsUseCase,
    MailerSettingsBeforeSaveEventHandler,
    MailerSettingsAfterSaveEventHandler,
    type MailerSettingsBeforeSavePayload,
    type MailerSettingsAfterSavePayload
} from "~/features/SaveSettings/abstractions.js";

/**
 * Invariant: no mailer save event may carry the password to its subscribers.
 * This test captures the actual event payloads delivered to handlers and
 * asserts the `password` property is absent. It is the mechanical guard
 * against a future refactor silently re-introducing the leak.
 */

const capturedBefore: MailerSettingsBeforeSavePayload[] = [];
const capturedAfter: MailerSettingsAfterSavePayload[] = [];

class BeforeCapture implements MailerSettingsBeforeSaveEventHandler.Interface {
    async handle(event: MailerSettingsBeforeSaveEventHandler.Event): Promise<void> {
        capturedBefore.push(event.payload);
    }
}

class AfterCapture implements MailerSettingsAfterSaveEventHandler.Interface {
    async handle(event: MailerSettingsAfterSaveEventHandler.Event): Promise<void> {
        capturedAfter.push(event.payload);
    }
}

const BeforeCaptureImpl = MailerSettingsBeforeSaveEventHandler.createImplementation({
    implementation: BeforeCapture,
    dependencies: []
});

const AfterCaptureImpl = MailerSettingsAfterSaveEventHandler.createImplementation({
    implementation: AfterCapture,
    dependencies: []
});

const registerCapturePlugin = createContextPlugin(ctx => {
    ctx.container.register(BeforeCaptureImpl);
    ctx.container.register(AfterCaptureImpl);
});

const input = {
    host: "dummy.webiny",
    user: "user",
    password: "super-secret-plaintext-password",
    from: "from@dummy.webiny",
    replyTo: "reply@dummy.webiny"
};

describe("Save settings events — password stripping invariant", () => {
    beforeEach(() => {
        capturedBefore.length = 0;
        capturedAfter.length = 0;
    });

    it("MailerSettingsBeforeSaveEvent payload never contains the password", async () => {
        const { handle } = createContextHandler({ plugins: [registerCapturePlugin] });
        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const result = await saveSettings.execute(input);

        expect(result.isOk()).toBe(true);
        expect(capturedBefore).toHaveLength(1);

        const { input: eventInput } = capturedBefore[0];
        expect(Object.prototype.hasOwnProperty.call(eventInput, "password")).toBe(false);
        // Sanity: non-sensitive fields are still delivered.
        expect(eventInput.host).toBe(input.host);
        expect(eventInput.user).toBe(input.user);
        expect(eventInput.from).toBe(input.from);
    });

    it("MailerSettingsAfterSaveEvent payload never contains the password", async () => {
        const { handle } = createContextHandler({ plugins: [registerCapturePlugin] });
        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const result = await saveSettings.execute(input);

        expect(result.isOk()).toBe(true);
        expect(capturedAfter).toHaveLength(1);

        const { settings: eventSettings } = capturedAfter[0];
        expect(Object.prototype.hasOwnProperty.call(eventSettings, "password")).toBe(false);
        // Sanity: non-sensitive fields are still delivered.
        expect(eventSettings.host).toBe(input.host);
        expect(eventSettings.user).toBe(input.user);
        expect(eventSettings.from).toBe(input.from);
    });
});
