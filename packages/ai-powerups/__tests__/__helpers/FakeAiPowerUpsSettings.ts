import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { GetSettingsRepository } from "~/api/features/GetSettings/abstractions.js";
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
 * Registers a `GetSettingsUseCase`, a `GetSettingsRepository` and a `GetDecryptedSettingsUseCase`
 * answering `settings`, or failing when given an `Error`. The decrypted one decrypts each stored key
 * with the container's `Encryption`. Call it after the features under test so it wins over their
 * own registration.
 */
export const registerFakeAiPowerUpsSettings = (
    container: Container,
    settings: IAiPowerUpsSettings | Error
): void => {
    class FakeGetSettings implements GetSettingsUseCase.Interface {
        public async execute(): Promise<Result<IAiPowerUpsSettings>> {
            if (settings instanceof Error) {
                // The abstraction types the failure as `never`; a real read can still fail.
                return Result.fail(settings) as unknown as Result<IAiPowerUpsSettings>;
            }
            return Result.ok(settings);
        }
    }
    class FakeGetSettingsRepository implements GetSettingsRepository.Interface {
        public async get(): Promise<Result<IAiPowerUpsSettings>> {
            return new FakeGetSettings().execute();
        }
    }
    class FakeGetDecryptedSettings implements GetDecryptedSettingsUseCase.Interface {
        public constructor(private encryption: Encryption.Interface) {}

        public async execute(): Promise<Result<IAiPowerUpsSettings, Error>> {
            if (settings instanceof Error) {
                return Result.fail(settings);
            }
            const presets = await Promise.all(
                (settings.connections?.presets ?? []).map(async preset => ({
                    ...preset,
                    apiKey: preset.apiKeyEncrypted
                        ? await this.encryption.decrypt(preset.apiKeyEncrypted)
                        : undefined
                }))
            );
            return Result.ok({ ...settings, connections: { ...settings.connections, presets } });
        }
    }
    container.register(
        GetSettingsUseCase.createImplementation({
            implementation: FakeGetSettings,
            dependencies: []
        })
    );
    container.register(
        GetSettingsRepository.createImplementation({
            implementation: FakeGetSettingsRepository,
            dependencies: []
        })
    );
    container.register(
        GetDecryptedSettingsUseCase.createImplementation({
            implementation: FakeGetDecryptedSettings,
            dependencies: [Encryption]
        })
    );
};
