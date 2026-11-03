import { createAbstraction, Result } from "@webiny/feature/api";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface IGetDecryptedSettingsUseCase {
    execute(): Promise<Result<IAiPowerUpsSettings, Error>>;
}

/**
 * Internal: returns the settings with each provider preset's `apiKey` decrypted.
 * For code that calls the AI providers. Never return its result to a client.
 */
export const GetDecryptedSettingsUseCase = createAbstraction<IGetDecryptedSettingsUseCase>(
    "AiPowerUpsGetDecryptedSettingsUseCase"
);

export namespace GetDecryptedSettingsUseCase {
    export type Interface = IGetDecryptedSettingsUseCase;
}
