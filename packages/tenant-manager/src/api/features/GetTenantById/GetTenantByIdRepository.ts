import { Result } from "@webiny/feature/api";
import { Tenant, TenantDto, TenantValues } from "~/shared/Tenant.js";
import { TENANT_MODEL_ID } from "../../domain/TenantModel.js";
import { TenantNotFoundError, TenantPersistenceError } from "../../domain/errors.js";
import { GetTenantByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js";
import { EntryId } from "@webiny/api-headless-cms/domain/contentEntry/EntryId.js";

class GetTenantByIdRepository implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryUseCase: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<Tenant, RepositoryAbstraction.Error>> {
        try {
            const entryId = EntryId.from(id);

            // Get the tenant model
            const modelResult = await this.getModelUseCase.execute(TENANT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(
                    new TenantPersistenceError(
                        new Error(`Model "${TENANT_MODEL_ID}" was not found!`)
                    )
                );
            }

            // Get the tenant entry
            const entryResult = await this.tenantContext.withRootTenant(() => {
                return this.getEntryUseCase.execute<TenantValues>(
                    modelResult.value,
                    entryId.toString()
                );
            });

            if (entryResult.isFail()) {
                return Result.fail(new TenantNotFoundError(id));
            }

            const tenantEntry = entryResult.value;

            const tenantDto: TenantDto = {
                id: tenantEntry.entryId,
                values: tenantEntry.values
            };

            return Result.ok(Tenant.from(tenantDto));
        } catch (error) {
            return Result.fail(new TenantPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: GetTenantByIdRepository,
    dependencies: [TenantContext, GetModelUseCase, GetEntryByIdUseCase]
});
