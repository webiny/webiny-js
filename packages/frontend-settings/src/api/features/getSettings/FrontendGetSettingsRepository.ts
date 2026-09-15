import { FrontendGetSettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { FRONTEND_SETTINGS_KEY } from "~/shared/constants.js";
import type { IFrontendSettings } from "~/shared/types.js";

const WB_SETTINGS_KEY = "WebsiteBuilder/Settings";
const DEFAULT_DOMAIN = "http://localhost:3000";

class FrontendGetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(): Promise<{ domain: string }> {
        const domain = await this.getDomain();
        return { domain };
    }

    private async getDomain(): Promise<string> {
        const result = await this.keyValueStore.get<IFrontendSettings>(FRONTEND_SETTINGS_KEY);

        if (!result.isFail() && result.value?.domain) {
            return result.value.domain;
        }

        const wbResult = await this.keyValueStore.get<{ previewDomain?: string }>(WB_SETTINGS_KEY);

        if (!wbResult.isFail() && wbResult.value?.previewDomain) {
            return wbResult.value.previewDomain;
        }

        return DEFAULT_DOMAIN;
    }
}

export const FrontendGetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: FrontendGetSettingsRepositoryImpl,
    dependencies: [KeyValueStore]
});
