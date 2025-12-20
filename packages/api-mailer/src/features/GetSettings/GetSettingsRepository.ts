import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as CoreGetSettings } from "@webiny/api-core/features/GetSettings";
import { Encryption } from "~/domain/Encryption/abstractions.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

const SETTINGS_NAME = "mailerTransportSettings";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
    constructor(
        private getSettings: CoreGetSettings.Interface,
        private encryption: Encryption.Interface
    ) {}

    async get(): Promise<Result<TransportSettings | null, never>> {
        const result = await this.getSettings.execute(SETTINGS_NAME);

        if (result.isFail()) {
            return Result.ok(null);
        }

        const settings = result.value;
        if (!settings) {
            return Result.ok(null);
        }

        const data = settings.data as GenericRecord<string>;

        // Decrypt password if present
        const password = data.password ? await this.encryption.decrypt(String(data.password)) : "";

        const transportSettings: TransportSettings = {
            host: String(data.host || ""),
            port: Number(data.port || 25),
            user: String(data.user || ""),
            password,
            from: String(data.from || ""),
            replyTo: data.replyTo ? String(data.replyTo) : undefined
        };

        return Result.ok(transportSettings);
    }
}

export const GetSettingsRepositoryImplementation = GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [CoreGetSettings, Encryption]
});
