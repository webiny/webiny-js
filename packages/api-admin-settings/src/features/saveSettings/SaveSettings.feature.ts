import type { ISaveSettingsFeature, SettingsDto } from "./abstractions/ISaveSettings.feature.js";
import { Settings } from "~/domain/Settings.js";
import type { ISaveSettingsRepository } from "./abstractions/ISaveSettings.repository.js";
import { SaveSettingsGateway } from "~/infrastructure/SaveSettings.gateway.js";
import { SaveSettingsRepository } from "~/features/saveSettings/SaveSettings.repository.js";
import type { Context } from "~/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export class SaveSettings implements ISaveSettingsFeature {
    private repository: ISaveSettingsRepository;

    private constructor(repository: ISaveSettingsRepository) {
        this.repository = repository;
    }
    async execute(data: SettingsDto): Promise<Settings> {
        const settings = new Settings(data.name, data.settings);

        await this.repository.execute(settings);

        return settings;
    }

    // TODO: when DI container is in place, refactor this.
    static create(context: Context): ISaveSettingsFeature {
        const getTenant = () => {
            return context.tenancy.getCurrentTenant().id;
        };

        // @ts-expect-error
        const documentClient = context.db.driver.documentClient;
        const gateway = new SaveSettingsGateway(documentClient as DynamoDBDocument);
        const repository = new SaveSettingsRepository(getTenant, gateway);
        const saveSettings = new SaveSettings(repository);

        return saveSettings;
    }
}
