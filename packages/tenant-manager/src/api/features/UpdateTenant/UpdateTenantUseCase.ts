import { Result } from "@webiny/feature/api";
import { Tenant } from "~/shared/Tenant.js";
import {
    UpdateTenantUseCase as UseCaseAbstraction,
    UpdateTenantRepository,
    UpdateTenantInput
} from "./abstractions.js";

class UpdateTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateTenantRepository.Interface) {}

    async execute(
        id: string,
        input: UpdateTenantInput
    ): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Delegate to repository
        const result = await this.repository.execute(id, input);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: UpdateTenantUseCase,
    dependencies: [UpdateTenantRepository]
});
