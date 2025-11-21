import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileManagerSettings } from "~/domain/settings/types.js";

/**
 * GetSettings use case - retrieves file manager settings.
 */
export interface IGetSettingsUseCase {
    execute(): Promise<Result<FileManagerSettings | null, never>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
