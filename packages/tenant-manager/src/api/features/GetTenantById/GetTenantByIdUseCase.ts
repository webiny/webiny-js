import { Tenant, rootTenantDto } from "~/shared/Tenant.js";
import {
    GetTenantByIdUseCase as UseCaseAbstraction,
    GetTenantByIdRepository
} from "./abstractions.js";
import { Result } from "@webiny/feature/api";

class GetTenantByIdUseCase implements UseCaseAbstraction.Interface {
    constructor(private repository: GetTenantByIdRepository.Interface) {}

    async execute(id: string): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Handle special root tenant case
        if (id === "root") {
            return Result.ok(Tenant.from(rootTenantDto));
        }

        // Delegate to repository
        const result = await this.repository.execute(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetTenantByIdUseCase,
    dependencies: [GetTenantByIdRepository]
});
