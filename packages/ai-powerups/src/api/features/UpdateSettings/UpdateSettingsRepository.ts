import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import {
  UpdateSettingsRepository,
  type UpdateSettingsInput,
} from "./abstractions.js";
import type { AiPowerUpsSettings } from "~/api/types.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

class UpdateSettingsRepositoryImpl
  implements UpdateSettingsRepository.Interface
{
  constructor(
    private keyValueStore: KeyValueStore.Interface,
    private encryption: Encryption.Interface,
  ) {}

  async execute(
    input: UpdateSettingsInput,
  ): Promise<Result<AiPowerUpsSettings, Error>> {
    const providerPresets = await Promise.all(
      input.providers.presets.map(async (provider) => ({
        ...provider,
        apiKey: await this.encryption.encrypt(provider.apiKey),
      })),
    );

    const result = await this.keyValueStore.set(AI_POWER_UPS_SETTINGS, {
      providers: { presets: providerPresets },
      personas: { presets: input.personas.presets },
    });

    if (result.isFail()) {
      return Result.fail(new Error(String(result.error)));
    }

    return Result.ok({
      providers: { presets: input.providers.presets },
      personas: { presets: input.personas.presets },
    });
  }
}

export const UpdateSettingsRepositoryImplementation =
  UpdateSettingsRepository.createImplementation({
    implementation: UpdateSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption],
  });
