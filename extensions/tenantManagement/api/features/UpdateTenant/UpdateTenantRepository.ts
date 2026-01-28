import { Result } from "webiny/api";
import { EntryId } from "webiny/api/cms/entry";
import { GetEntryUseCase, UpdateEntryUseCase } from "webiny/api/cms/entry";
import { GetModelUseCase } from "webiny/api/cms/model";
import { Tenant, TenantDto, TenantValues } from "../../../shared/Tenant.js";
import { TENANT_MODEL_ID } from "../../domain/TenantModel.js";
import { TenantNotFoundError, TenantPersistenceError } from "../../domain/errors.js";
import {
    UpdateTenantRepository as RepositoryAbstraction,
    UpdateTenantInput
} from "./abstractions.js";

class UpdateTenantRepository implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateTenantInput
    ): Promise<Result<Tenant, RepositoryAbstraction.Error>> {
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

            // Get the current tenant entry to verify it exists
            const getEntryResult = await this.getEntryUseCase.execute<TenantValues>(
                modelResult.value,
                {
                    where: { entryId: entryId.id, latest: true }
                }
            );

            if (getEntryResult.isFail()) {
                return Result.fail(new TenantNotFoundError(id));
            }

            const updateResult = await this.updateEntryUseCase.execute(
                modelResult.value,
                entryId.toString(),
                {
                    values: input
                }
            );

            if (updateResult.isFail()) {
                return Result.fail(new TenantPersistenceError(updateResult.error));
            }

            const updatedEntry = updateResult.value;

            const tenantDto: TenantDto = {
                id: updatedEntry.entryId,
                values: updatedEntry.values as TenantValues
            };

            return Result.ok(Tenant.from(tenantDto));
        } catch (error) {
            return Result.fail(new TenantPersistenceError(error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: UpdateTenantRepository,
    dependencies: [GetModelUseCase, GetEntryUseCase, UpdateEntryUseCase]
});
