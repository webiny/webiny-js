import { Result } from "@webiny/feature/api";
import { Encryption } from "~/domain/Encryption/abstractions.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { MAILER_TRANSPORT_SETTINGS } from "~/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface
    ) {}

    async get(): Promise<Result<TransportSettings | null>> {
        const result = await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);

        if (result.isFail()) {
            return Result.ok(null);
        }

        const settings = result.value;
        if (!settings) {
            return Result.ok(null);
        }

        // Decrypt password if present
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

        return Result.ok(transportSettings);
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption]
});
