import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { AUDIT } from "@webiny/api-audit-logs";
import { RecordAuditLogUseCase } from "@webiny/api-audit-logs/features/RecordAuditLog/abstractions.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { MailerSettingsAfterSaveEventHandler } from "~/api/features/SaveSettings/abstractions.js";
import { AuditLogFeature } from "~/api/features/AuditLog/feature.js";

const settings = { host: "smtp.example.com", user: "user", from: "noreply@example.com" };

const setup = (auditLogsEnabled: boolean) => {
    const record = vi.fn(async () => Result.ok(null));

    const container = new Container();
    container.registerInstance(FeatureFlags, {
        get: () => ({ isEnabled: (name: string) => name === "auditLogs" && auditLogsEnabled })
    } as unknown as FeatureFlags.Interface);
    container.registerInstance(RecordAuditLogUseCase, {
        execute: record
    } as unknown as RecordAuditLogUseCase.Interface);

    AuditLogFeature.register(container);

    return { handlers: container.resolveAll(MailerSettingsAfterSaveEventHandler), record };
};

describe("SMTP settings audit log", () => {
    it("records an audit log when the settings are saved", async () => {
        const { handlers, record } = setup(true);
        expect(handlers).toHaveLength(1);

        await handlers[0].handle({
            payload: { settings }
        } as MailerSettingsAfterSaveEventHandler.Event);

        expect(record).toHaveBeenCalledWith({
            audit: AUDIT.MAILER.SETTINGS.UPDATE,
            message: "Settings updated",
            content: { after: settings },
            entityId: "-"
        });
    });

    it("registers nothing when audit logs are not licensed", () => {
        const { handlers } = setup(false);

        expect(handlers).toHaveLength(0);
    });
});
