import type { CreateTenantUseCase } from "../abstractions.js";
import type { Tenant, CreateTenantInput } from "~/types.js";

// TODO: This decorator will be implemented in @webiny/api-wcp package
// It will wrap CreateTenantUseCase and:
// 1. Call incrementWcpTenants() before tenant creation
// 2. On error, call decrementWcpTenants() to rollback
// 3. Otherwise, return the created tenant

export class CreateTenantWithWcpIncrement implements CreateTenantUseCase.Interface {
    constructor(
        private decoratee: CreateTenantUseCase.Interface,
        private incrementWcpTenants: () => Promise<void>,
        private decrementWcpTenants: () => Promise<void>
    ) {}

    async execute(data: CreateTenantInput) {
        await this.incrementWcpTenants();

        const result = await this.decoratee.execute(data);

        if (result.isFail()) {
            this.decrementWcpTenants();
        }

        return result;
    }
}
