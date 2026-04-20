import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsRepository } from "./abstractions.js";
import type { AiProvider, AiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class GetSettingsRepositoryImpl implements GetSettingsRepository.Interface {
  constructor(
    private keyValueStore: KeyValueStore.Interface,
    private encryption: Encryption.Interface,
  ) {}

  async get(): Promise<Result<AiPowerUpsSettings>> {
    const result = await this.keyValueStore.get<AiPowerUpsSettings>(
      AI_POWER_UPS_SETTINGS,
    );

    if (result.isFail() || !result.value) {
      return Result.ok({
        providers: { presets: [] },
        personas: { presets: [] },
      });
    }

    const settings = result.value;

    const providerPresets = await Promise.all(
      (settings.providers?.presets ?? []).map(async (provider: AiProvider) => ({
        ...provider,
        apiKey: await this.encryption.decrypt(provider.apiKey),
      })),
    );

    return Result.ok({
      providers: { presets: providerPresets },
      personas: { presets: settings.personas?.presets ?? [] },
    });
  }
}

export const GetSettingsRepositoryImplementation =
  GetSettingsRepository.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption],
  });
