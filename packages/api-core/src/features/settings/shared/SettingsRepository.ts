import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { SettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import { SettingsStorageOperations } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { SettingsModelFactory } from "~/domain/settings/index.js";
import type { ISettings } from "~/domain/settings/index.js";
import { SettingsNotFoundError, SettingsStorageError } from "./errors.js";

class SettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SettingsStorageOperations.Interface,
        private modelFactory: SettingsModelFactory.Interface
    ) {}

    async get(name: string): Promise<Result<ISettings, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            const storageRecord = await this.storageOperations.getSettings({
                name,
                tenant: tenant.id
            });

            if (!storageRecord) {
                return Result.fail(new SettingsNotFoundError(name));
            }

            // Map storage record to domain model (remove tenant)
            const settings = await this.modelFactory.create({
                name: storageRecord.name,
                data: storageRecord.data
            });

            return Result.ok(settings);
        } catch (error) {
            return Result.fail(new SettingsStorageError(error as Error));
        }
    }

    async update(settings: ISettings): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            await this.storageOperations.updateSettings({
                name: settings.name,
                data: settings.data,
                tenant: tenant.id
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new SettingsStorageError(error as Error));
        }
    }
}

export const SettingsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: SettingsRepositoryImpl,
    dependencies: [TenantContext, SettingsStorageOperations, SettingsModelFactory]
});
