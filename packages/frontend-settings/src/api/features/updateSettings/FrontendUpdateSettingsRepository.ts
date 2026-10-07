import { FrontendUpdateSettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { FRONTEND_SETTINGS_KEY } from "~/shared/constants.js";
import type { IFrontendSettings } from "~/shared/types.js";

class FrontendUpdateSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(data: IFrontendSettings): Promise<boolean> {
        await this.keyValueStore.set(FRONTEND_SETTINGS_KEY, data);
        return true;
    }
}

export const FrontendUpdateSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: FrontendUpdateSettingsRepositoryImpl,
    dependencies: [KeyValueStore]
});
