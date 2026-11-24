import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetSettingsRepository, type ISettingsWithSource } from "./abstractions.js";
import { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import {
    findDefinition,
    getStorageKey,
    withDefaults
} from "~/domain/TransportSettings/findDefinition.js";
import { UnknownTransportSettings } from "~/domain/errors.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface,
        private definitions: TransportSettingsDefinition.Interface[]
    ) {}

    async get<TSettings extends object>(
        transport: string
    ): Promise<Result<ISettingsWithSource<TSettings>, UnknownTransportSettings>> {
        const definition = findDefinition(this.definitions, transport);
        if (!definition) {
            return Result.fail(new UnknownTransportSettings(transport));
        }

        // Settings set in code win over stored ones.
        const codeSettings = definition.getCodeSettings?.() ?? null;
        if (codeSettings !== null) {
            return Result.ok({
                settings: withDefaults(definition, codeSettings) as TSettings,
                source: "code"
            });
        }

        const result = await this.keyValueStore.get<TransportSettingsDefinition.Values>(
            getStorageKey(definition)
        );
        if (result.isFail() || !result.value) {
            return Result.ok({ settings: null, source: null });
        }

        const settings = { ...result.value };
        for (const secret of definition.secrets ?? []) {
            settings[secret] = settings[secret]
                ? await this.encryption.decrypt(String(settings[secret]))
                : "";
        }

        return Result.ok({
            settings: withDefaults(definition, settings) as TSettings,
            source: "storage"
        });
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption, [TransportSettingsDefinition, { multiple: true }]]
});
