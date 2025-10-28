import type { IGetSettingsFeature } from "./abstractions/IGetSettings.feature.js";
import type { IGetSettingsRepository } from "./abstractions/IGetSettings.repository.js";
import type { Settings } from "~/domain/Settings.js";
import { GetSettingsRepository } from "./GetSettings.repository.js";
import { GetSettingsGateway } from "~/infrastructure/GetSettings.gateway.js";
import type { Context } from "~/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

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

        // @ts-expect-error
        const documentClient = context.db.driver.documentClient;
        const gateway = new GetSettingsGateway(documentClient as DynamoDBDocument);
        const repository = new GetSettingsRepository(getTenant, gateway);
        const getSettings = new GetSettings(repository);

        return getSettings;
    }
}
