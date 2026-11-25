import { describe, expect, it, vi } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { MailerSettingsAfterSaveEventHandler } from "@webiny/api-mailer";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { createMailerHooks } from "~/subscriptions/mailer/index.js";
import { AUDIT } from "~/config.js";

const setup = () => {
    const record = vi.fn(async () => Result.ok(null));
    const container = new Container();
    container.registerInstance(RecordAuditLogUseCase, {
        execute: record
    } as unknown as RecordAuditLogUseCase.Interface);
    createMailerHooks(container);
    return { handlers: container.resolveAll(MailerSettingsAfterSaveEventHandler), record };
};

describe("mailer settings audit log", () => {
    it("records the saved settings of any transport, keyed by the transport", async () => {
        const { handlers, record } = setup();
        expect(handlers).toHaveLength(1);

        await handlers[0].handle({
            payload: { transport: "Acme/HttpTransport", settings: { from: "a@b.com" } }
        } as unknown as MailerSettingsAfterSaveEventHandler.Event);

        expect(record).toHaveBeenCalledWith({
            audit: AUDIT.MAILER.SETTINGS.UPDATE,
            message: "Settings updated",
            content: { after: { transport: "Acme/HttpTransport", from: "a@b.com" } },
            entityId: "Acme/HttpTransport"
        });
    });
});
