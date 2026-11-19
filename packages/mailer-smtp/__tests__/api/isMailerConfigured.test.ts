import { describe, expect, it } from "vitest";
import { createContextHandler } from "./contextHandler.js";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings.js";
import { IsMailerConfiguredUseCase } from "@webiny/api-mailer/features/IsMailerConfigured/index.js";
import type { TransportSettings } from "~/api/types.js";

const smtpSettings: TransportSettings = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "user",
    password: "password",
    from: "noreply@example.com"
};

describe("IsMailerConfiguredUseCase", () => {
    it("is false when no transport is configured", async () => {
        const { handle } = createContextHandler();
        const context = await handle();

        expect(await context.container.resolve(IsMailerConfiguredUseCase).execute()).toBe(false);
    });

    it("is true once SMTP settings are set in code", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(smtpSettings)]
        });
        const context = await handle();

        expect(await context.container.resolve(IsMailerConfiguredUseCase).execute()).toBe(true);
    });
});
