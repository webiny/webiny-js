import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { GetDecryptedSettingsUseCase } from "~/api/features/GetDecryptedSettings/index.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ConnectionPresetOptions {
    id: string;
    sdkName: string;
    /** The stored ciphertext; `""` is a connection without a key. Defaults to `encrypted-<id>`. */
    apiKeyEncrypted?: string;
    name?: string;
}

export const createConnectionPreset = (options: ConnectionPresetOptions): AiConnectionPreset => {
    return {
        id: options.id,
        name: options.name ?? `Connection ${options.id}`,
        sdkName: options.sdkName,
        apiKeyMasked: "sk-…9999",
        apiKeyEncrypted: options.apiKeyEncrypted ?? `encrypted-${options.id}`
    };
};

export interface AiPowerUpsSettingsOptions {
    connections?: AiConnectionPreset[];
    /** Capability entries by capability id, e.g. `{ "test.capability": { enabled: false } }`. */
    capabilityItems?: Record<string, unknown>;
    /** Model roles by role id; defaults to a `standard` role on `conn-1`. */
    roles?: Record<string, { connectionId: string; model: string }>;
}

/** The settings an `AI Power-Ups` project stores, reduced to what the resolver and service read. */
export const createAiPowerUpsSettings = (
    options: AiPowerUpsSettingsOptions = {}
): IAiPowerUpsSettings => {
    return {
        connections: { presets: options.connections ?? [] },
        modelRoles: {
            roles: options.roles ?? {
                fast: { connectionId: "", model: "" },
                standard: { connectionId: "conn-1", model: "anthropic/claude-sonnet-4-5" },
                vision: { connectionId: "", model: "" }
            }
        },
        capabilities: { items: options.capabilityItems ?? {} }
    } as unknown as IAiPowerUpsSettings;
};

/**
 * Registers a `GetSettingsUseCase` and a `GetDecryptedSettingsUseCase` answering `settings`, or
 * failing when given an `Error`. Call it after the features under test so it wins over their own
 * registration.
 *
 * The decrypted variant decrypts each stored key with the registered `Encryption`, so a test's
 * stub decides what the key looks like. Without one the stored value is handed back as the key.
 */
export const registerFakeAiPowerUpsSettings = (
    container: Container,
    settings: IAiPowerUpsSettings | Error
): void => {
    class FakeGetSettings implements GetSettingsUseCase.Interface {
        public async execute(): Promise<Result<IAiPowerUpsSettings, Error>> {
            if (settings instanceof Error) {
                return Result.fail(settings);
            }
            return Result.ok(settings);
        }
    }
    class FakeGetDecryptedSettings implements GetDecryptedSettingsUseCase.Interface {
        public constructor(private encryption: Encryption.Interface | undefined) {}

        public async execute(): Promise<Result<IAiPowerUpsSettings, Error>> {
            if (settings instanceof Error) {
                return Result.fail(settings);
            }
            const presets = await Promise.all(
                (settings.connections?.presets ?? []).map(async preset => {
                    if (!preset.apiKeyEncrypted) {
                        return { ...preset, apiKey: undefined };
                    }
                    const apiKey = this.encryption
                        ? await this.encryption.decrypt(preset.apiKeyEncrypted)
                        : preset.apiKeyEncrypted;
                    return { ...preset, apiKey };
                })
            );
            return Result.ok({
                ...settings,
                connections: { ...settings.connections, presets }
            });
        }
    }
    container.register(
        GetSettingsUseCase.createImplementation({
            implementation: FakeGetSettings,
            dependencies: []
        })
    );
    container.register(
        GetDecryptedSettingsUseCase.createImplementation({
            implementation: FakeGetDecryptedSettings,
            dependencies: [[Encryption, { optional: true }]]
        })
    );
};
