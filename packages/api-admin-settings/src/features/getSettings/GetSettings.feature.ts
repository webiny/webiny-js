import type { IGetSettingsFeature } from "./abstractions/IGetSettings.feature";
import type { IGetSettingsRepository } from "./abstractions/IGetSettings.repository";
import type { Settings } from "~/domain/Settings";
import { GetSettingsRepository } from "./GetSettings.repository";
import { GetSettingsGateway } from "~/infrastructure/GetSettings.gateway";
import type { Context } from "~/types";

export class GetSettings implements IGetSettingsFeature {
    private repository: IGetSettingsRepository;

    constructor(repository: IGetSettingsRepository) {
        this.repository = repository;
    }

    execute(name: string): Promise<Settings> {
        return this.repository.execute(name);
    }

    // TODO: when DI container is in place, refactor this.
    static create(context: Context): IGetSettingsFeature {
        const getTenant = () => {
            return context.tenancy.getCurrentTenant().id;
        };

        // @ts-expect-error `context.db` is a hidden "feature".
        const gateway = new GetSettingsGateway(context.db.driver.documentClient);
        const repository = new GetSettingsRepository(getTenant, gateway);
        const getSettings = new GetSettings(repository);

        return getSettings;
    }
}
