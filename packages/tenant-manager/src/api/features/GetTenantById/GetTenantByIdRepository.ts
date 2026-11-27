import { Result } from "@webiny/feature/api";
import { Tenant, TenantDto, TenantValues } from "~/shared/Tenant.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import {
    TenantModelNotFoundError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";
import { GetTenantByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { TenantScopes } from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js";
import { EntryId } from "@webiny/api-headless-cms/domain/contentEntry/EntryId.js";

class GetTenantByIdRepository implements RepositoryAbstraction.Interface {
    constructor(private tenantScopes: TenantScopes.Interface) {}

    async execute(id: string): Promise<Result<Tenant, RepositoryAbstraction.Error>> {
        try {
            const entryId = EntryId.from(id);

            // TODO: nested tenants. A tenant's entry lives in its parent's CMS (createTenant and
            //  updateTenant use the current tenant), but this always reads from root, so tenants
            //  created from a sub-tenant are never found (install/enable/disable fail with
            //  Tenant/NotFound). Read from the core tenant's parent, or from the current tenant
            //  when the core tenant doesn't exist yet.
            const entryResult = await this.tenantScopes.withRootTenant(async scope => {
                // Get the tenant model
                const modelResult = await scope.resolve(GetModelUseCase).execute(TENANT_MODEL_ID);
                if (modelResult.isFail()) {
                    return Result.fail(new TenantModelNotFoundError());
                }

                // Get the tenant entry
                const result = await scope
                    .resolve(GetEntryByIdUseCase)
                    .execute<TenantValues>(modelResult.value, entryId.toString());
                if (result.isFail()) {
                    return Result.fail(new TenantNotFoundError(id));
                }
                return Result.ok(result.value);
            });

            if (entryResult.isFail()) {
                return Result.fail(entryResult.error);
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
    dependencies: [TenantScopes]
});
