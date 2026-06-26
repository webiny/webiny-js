import { makeAutoObservable, runInAction } from "mobx";
import type { MailerSettings } from "~/types.js";
import {
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway
} from "./abstractions.js";

class GetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    settings: MailerSettings | null = null;

    constructor(private gateway: GetSettingsGateway.Interface) {
        makeAutoObservable(this);
    }

    async execute(): Promise<MailerSettings> {
        const result = await this.gateway.execute();

        runInAction(() => {
            this.settings = result;
        });

        return result;
    }

    updateSettings(settings: MailerSettings): void {
        runInAction(() => {
            this.settings = settings;
        });
    }
}

export const GetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [GetSettingsGateway]
});
