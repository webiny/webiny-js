import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { DefaultSrcPrefix } from "~/features/settings/DefaultSrcPrefix/index.js";

const DEFAULT_SETTINGS: FileManagerSettings = {
    uploadMinFileSize: 0,
    uploadMaxFileSize: 10737418240,
    srcPrefix: ""
};

/**
 * Returns the settings in effect. The stored `srcPrefix` is only a custom one; when none is stored,
 * the prefix is the current default (`DefaultSrcPrefix`), so file URLs follow the API's public URL.
 */
class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private defaultSrcPrefix: DefaultSrcPrefix.Interface
    ) {}

    async execute(): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        const result = await this.keyValueStore.get<FileManagerSettings>(
            FILE_MANAGER_GENERAL_SETTINGS
        );

        const stored = result.isFail() ? DEFAULT_SETTINGS : result.value;
        const srcPrefix = stored.srcPrefix || (await this.defaultSrcPrefix.get());

        return Result.ok({ ...stored, srcPrefix });
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [KeyValueStore, DefaultSrcPrefix]
});
