import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetSettingsRepository, type ISettingsWithSource } from "./abstractions.js";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";
import { MAILER_TRANSPORT_SETTINGS } from "~/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface,
        private codeSettings: CodeMailerSettings.Interface
    ) {}

    async get(transportName: string): Promise<Result<ISettingsWithSource>> {
        // Code-defined settings win over the KV store.
        const codeSettingsValue = this.codeSettings.get(transportName);
        if (codeSettingsValue !== null) {
            return Result.ok({
                settings: codeSettingsValue,
                source: "code"
            });
        }

        const result = await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);

        if (result.isFail()) {
            return Result.ok({ settings: null, source: null });
        }

        const settings = result.value;
        if (!settings) {
            return Result.ok({ settings: null, source: null });
        }

        // Decrypt password if present.
        const password = settings.password
            ? await this.encryption.decrypt(String(settings.password))
            : "";

        const transportSettings: TransportSettings = {
            host: String(settings.host || ""),
            port: Number(settings.port || 25),
            user: String(settings.user || ""),
            password,
            from: String(settings.from || ""),
            replyTo: settings.replyTo ? String(settings.replyTo) : undefined
        };

        return Result.ok({ settings: transportSettings, source: "storage" });
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption, CodeMailerSettings]
});
