import { Tenant, TenantValues } from "~/shared/Tenant.js";
import { TenantCreationError, TenantModelNotFoundError } from "../../domain/errors.js";
import { CreateTenantRepository as RepositoryAbstraction } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class CreateTenantRepository implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface
    ) {}

    async execute(tenant: Tenant): Promise<Result<Tenant, RepositoryAbstraction.Error>> {
        try {
            // Get the tenant model
            const modelResult = await this.getModelUseCase.execute(TENANT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new TenantModelNotFoundError());
            }

            // Prepare tenant values with default isInstalled: false
            const tenantValues: TenantValues = {
                name: tenant.values.name,
                description: tenant.values.description,
                isInstalled: false,
                extensions: tenant.values.extensions || {}
            };

            // Create the tenant entry
            const createResult = await this.createEntryUseCase.execute(modelResult.value, {
                id: tenant.id,
                values: tenantValues
            });

            if (createResult.isFail()) {
                return Result.fail(new TenantCreationError(createResult.error));
            }

            return Result.ok(tenant);
        } catch (error) {
            return Result.fail(new TenantCreationError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: CreateTenantRepository,
    dependencies: [GetModelUseCase, CreateEntryUseCase]
});
