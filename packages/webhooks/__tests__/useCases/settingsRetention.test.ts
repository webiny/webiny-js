import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

describe("Webhook settings deliveryRetentionDays", () => {
    const handler = useHandler();

    it("should default to undefined when not set", async () => {
        const context = await handler.handle();
        const getSettings = context.container.resolve(GetWebhookSettingsRepository);

        const result = await getSettings.execute();
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBeUndefined();
    });

    it("should save and read back deliveryRetentionDays", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const getSettings = context.container.resolve(GetWebhookSettingsRepository);

        const updateResult = await updateSettings.execute({ deliveryRetentionDays: 30 });
        expect(updateResult.isOk()).toBe(true);
        expect(updateResult.value.deliveryRetentionDays).toBe(30);

        const readResult = await getSettings.execute();
        expect(readResult.isOk()).toBe(true);
        expect(readResult.value.deliveryRetentionDays).toBe(30);
    });

    it("should accept 0 (delete immediately)", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({ deliveryRetentionDays: 0 });
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBe(0);
    });

    it("should accept the maximum value", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({
            deliveryRetentionDays: WEBHOOK_DELIVERY_MAX_RETENTION_DAYS
        });
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBe(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS);
    });

    it("should reject values above the maximum", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({
            deliveryRetentionDays: WEBHOOK_DELIVERY_MAX_RETENTION_DAYS + 1
        });
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should reject negative values", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({ deliveryRetentionDays: -1 });
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should preserve deliveryRetentionDays when updating only signingSecret", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const getSettings = context.container.resolve(GetWebhookSettingsRepository);

        await updateSettings.execute({ deliveryRetentionDays: 30 });
        await updateSettings.execute({ signingSecret: "new-secret" });

        const readResult = await getSettings.execute();
        expect(readResult.isOk()).toBe(true);
        expect(readResult.value.deliveryRetentionDays).toBe(30);
    });
});
