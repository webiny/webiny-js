import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Masker } from "@webiny/api-core/features/masker/index.js";
import ConnectionsHandler from "~/api/features/Connections/ConnectionsHandler.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { ConnectionsSettings } from "~/api/features/Connections/types.js";

class StubEncryption implements Encryption.Interface {
    async encrypt(plain: string) {
        return `enc(${plain})`;
    }
    async decrypt(encrypted: string) {
        return encrypted.replace(/^enc\((.*)\)$/, "$1");
    }
}

class StubMasker implements Masker.Interface {
    mask(value: string) {
        return `${value.slice(0, 4)}…${value.slice(-2)}`;
    }
}

function handler(): AiPowerUpsSettingsGroupHandler.Interface {
    const container = new Container();
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    container.register(
        Masker.createImplementation({ implementation: StubMasker, dependencies: [] })
    );
    container.register(ConnectionsHandler);

    return container.resolve(AiPowerUpsSettingsGroupHandler);
}

/** A settings blob from before this section existed. */
const legacyRaw = {
    providers: {
        presets: [
            {
                id: "prov-1",
                name: "Anthropic",
                model: "anthropic/claude-sonnet-4-5",
                apiKeyEncrypted: "enc(sk-ant-real)",
                apiKeyMasked: "sk-a…al"
            }
        ]
    }
};

describe("ConnectionsHandler", () => {
    it("derives connections from the legacy providers section", () => {
        const result = handler().mapFromStorage(undefined, legacyRaw) as ConnectionsSettings;

        expect(result.presets).toEqual([
            {
                id: "prov-1",
                name: "Anthropic",
                sdkName: "anthropic",
                apiKeyMasked: "sk-a…al",
                apiKeyEncrypted: "enc(sk-ant-real)"
            }
        ]);
    });

    it("ignores the legacy section once connections exist", () => {
        const result = handler().mapFromStorage(
            { presets: [{ id: "c1", name: "Mine", sdkName: "openai", apiKeyEncrypted: "enc(k)" }] },
            legacyRaw
        ) as ConnectionsSettings;

        expect(result.presets).toHaveLength(1);
        expect(result.presets[0].id).toBe("c1");
    });

    /*
     * The bug this test exists for. The form only ever sees a mask, so an unchanged key comes back
     * as the mask and `mapToStorage` has to recognise it and carry the ciphertext forward. On the
     * first save after an upgrade the "existing" value is itself derived from `providers`, and
     * `UpdateSettingsRepository` was calling `mapFromStorage` without the full blob. It compared
     * against an empty list, matched nothing, and wrote an empty key: the project's real API key,
     * silently gone on the first save.
     */
    it("carries a masked key forward instead of blanking it", async () => {
        const h = handler();
        const existing = h.mapFromStorage(undefined, legacyRaw);

        const stored = (await h.mapToStorage(
            {
                presets: [
                    { id: "prov-1", name: "Anthropic", sdkName: "anthropic", apiKey: "sk-a…al" }
                ]
            },
            existing
        )) as { presets: Array<{ apiKeyEncrypted: string }> };

        expect(stored.presets[0].apiKeyEncrypted).toBe("enc(sk-ant-real)");
    });

    it("encrypts and masks a newly entered key", async () => {
        const stored = (await handler().mapToStorage(
            {
                presets: [{ id: "c1", name: "New", sdkName: "openai", apiKey: "sk-brand-new-key" }]
            },
            null
        )) as { presets: Array<{ apiKeyEncrypted: string; apiKeyMasked: string }> };

        expect(stored.presets[0].apiKeyEncrypted).toBe("enc(sk-brand-new-key)");
        expect(stored.presets[0].apiKeyMasked).not.toContain("brand");
    });

    it("accepts a null apiKey from the form", () => {
        const result = handler().inputSchema.safeParse({
            presets: [{ id: "c1", name: "New", sdkName: "openai", apiKey: null }]
        });

        expect(result.success).toBe(true);
    });
});
