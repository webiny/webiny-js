import { makeAutoObservable, runInAction } from "mobx";
import type { FmSettings } from "../shared/types.js";
import {
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway,
    SaveSettingsGateway
} from "./abstractions.js";

class GetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    settings: FmSettings | null = null;

    constructor(
        private gateway: GetSettingsGateway.Interface,
        private saveGateway: SaveSettingsGateway.Interface
    ) {
        makeAutoObservable(this);
    }

    async execute(): Promise<FmSettings> {
        const result = await this.gateway.execute();

        runInAction(() => {
            this.settings = result;
        });

        return result;
    }

    async save(data: FmSettings): Promise<FmSettings> {
        const result = await this.saveGateway.execute(data);

        runInAction(() => {
            this.settings = result;
        });

        return result;
    }
}

export const GetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [GetSettingsGateway, SaveSettingsGateway]
});
