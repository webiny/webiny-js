import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Masker } from "@webiny/api-core/features/masker/index.js";
import ProvidersHandler from "~/api/features/Providers/ProvidersHandler.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { ProvidersSettings } from "~/api/features/Providers/types.js";

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

/**
 * No `AiModelRegistry` is registered: the handler must not need the model catalog at all, since
 * the legacy section is carried forward on every save and nobody can edit it anymore.
 */
function handler(): AiPowerUpsSettingsGroupHandler.Interface {
    const container = new Container();
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    container.register(
        Masker.createImplementation({ implementation: StubMasker, dependencies: [] })
    );
    container.register(ProvidersHandler);

    return container.resolve(AiPowerUpsSettingsGroupHandler);
}

/** A preset whose model has since been shut down and dropped from the catalog. */
const stored: ProvidersSettings = {
    presets: [
        {
            id: "prov-1",
            name: "OpenAI",
            model: "openai/gpt-5.3-chat-latest",
            apiKeyEncrypted: "enc(sk-openai-real)",
            apiKeyMasked: "sk-o…al"
        }
    ]
};

describe("ProvidersHandler", () => {
    it("saves a preset whose model is no longer in the catalog", async () => {
        const input = handler().inputSchema.parse({
            presets: [
                {
                    id: "prov-1",
                    name: "OpenAI",
                    model: "openai/gpt-5.3-chat-latest",
                    apiKey: "sk-o…al"
                }
            ]
        });

        const result = await handler().mapToStorage(input, stored);

        expect(result).toEqual({
            presets: [
                {
                    id: "prov-1",
                    name: "OpenAI",
                    description: undefined,
                    model: "openai/gpt-5.3-chat-latest",
                    apiKeyEncrypted: "enc(sk-openai-real)",
                    apiKeyMasked: "sk-o…al"
                }
            ]
        });
    });
});
