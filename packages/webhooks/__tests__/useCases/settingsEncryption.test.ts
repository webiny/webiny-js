import { describe, it, expect } from "vitest";
import { createCacheKey } from "@webiny/utils";
import { useHandler } from "~tests/helpers/useHandler.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { StorageOperations } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/api/domain/constants.js";

describe("Webhook settings signingSecret is encrypted in storage", () => {
    const SECRET = "my-super-secret-signing-key";

    const handler = useHandler({
        encryptionPassphrase: "test-encryption-passphrase"
    });

    it("should store signingSecret encrypted and decrypt back to the original value", async () => {
        const context = await handler.handle();
        const container = context.container;

        const updateSettings = container.resolve(UpdateWebhookSettingsUseCase);
        const getModel = container.resolve(GetModelRepository);
        const storageOps = container.resolve(StorageOperations);
        const encryption = container.resolve(Encryption);

        const updateResult = await updateSettings.execute({
            signingSecret: SECRET
        });
        expect(updateResult.isOk()).toBe(true);

        const modelResult = await getModel.execute(WEBHOOK_SETTINGS_MODEL_ID);
        expect(modelResult.isOk()).toBe(true);
        const model = modelResult.value;

        const singletonId = createCacheKey(WEBHOOK_SETTINGS_MODEL_ID);
        const entryId = `${singletonId}#0001`;

        const rawEntry = await storageOps.entries.getLatestRevisionByEntryId(model, {
            id: entryId
        });
        expect(rawEntry).not.toBeNull();

        const rawSigningSecret = rawEntry!.values.signingSecret;

        /* Raw value must NOT be the plaintext secret. */
        expect(rawSigningSecret).not.toBe(SECRET);

        /* Decrypting the raw value must recover the original secret. */
        const decrypted = await encryption.decrypt(rawSigningSecret);
        expect(decrypted).toBe(SECRET);
    });

    it("should round-trip: domain → storage (encrypted) → domain (decrypted)", async () => {
        const context = await handler.handle();
        const container = context.container;

        const updateSettings = container.resolve(UpdateWebhookSettingsUseCase);
        const getSettings = container.resolve(GetWebhookSettingsRepository);

        const updateResult = await updateSettings.execute({
            signingSecret: SECRET
        });
        expect(updateResult.isOk()).toBe(true);

        const readResult = await getSettings.execute();
        expect(readResult.isOk()).toBe(true);
        expect(readResult.value.signingSecret).toBe(SECRET);
    });
});
