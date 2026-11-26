import { Result } from "@webiny/feature/api";
import { Tenant } from "~/shared/Tenant.js";
import type { TenantValues } from "~/shared/Tenant.js";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { TenantModelNotFoundError } from "../../domain/errors.js";
import { TenantPersistenceError } from "../../domain/errors.js";
import { ListTenantsRepository as RepositoryAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";

// Enough for a switcher; past this, the search narrows it down.
const LIMIT = 50;

class ListTenantsRepository implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(
        input: RepositoryAbstraction.Input
    ): Promise<Result<Tenant[], RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(TENANT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new TenantModelNotFoundError());
            }

            const search = input.search?.trim();
            const valuesWhere: CmsEntryListWhereValues = { status: "enabled", isInstalled: true };
            if (search) {
                valuesWhere.name_contains = search;
            }

            // TODO: nested tenants. Like GetTenantByIdRepository, this reads the root tenant's CMS,
            //  so it lists the root's direct children only, wherever the request comes from.
            const listResult = await this.tenantContext.withRootTenant(() => {
                return this.listEntriesUseCase.execute<TenantValues>(modelResult.value, {
                    where: { values: valuesWhere },
                    limit: LIMIT
                });
            });

            if (listResult.isFail()) {
                return Result.fail(new TenantPersistenceError(listResult.error as Error));
            }

            const { entries } = listResult.value;

            const tenants = entries
                .map(entry => Tenant.from({ id: entry.entryId, values: entry.values }))
                .sort((a, b) => a.values.name.localeCompare(b.values.name));

            return Result.ok(tenants);
        } catch (error) {
            return Result.fail(new TenantPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: ListTenantsRepository,
    dependencies: [TenantContext, GetModelUseCase, ListLatestEntriesUseCase]
});
