import { Result } from "webiny/api";
import { GetEntryUseCase, EntryId } from "webiny/api/cms/entry";
import { GetModelUseCase } from "webiny/api/cms/model";
import { Tenant, TenantDto, TenantValues } from "../../domain/Tenant.js";
import { TENANT_MODEL_ID } from "../../domain/TenantModel.js";
import { TenantNotFoundError, TenantPersistenceError } from "../../domain/errors.js";
import { GetTenantByIdRepository as RepositoryAbstraction } from "./abstractions.js";

class GetTenantByIdRepository implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface
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
            const entryResult = await this.getEntryUseCase.execute<TenantValues>(
                modelResult.value,
                {
                    where: { entryId: entryId.id, latest: true }
                }
            );

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
    dependencies: [GetModelUseCase, GetEntryUseCase]
});
