import type { DeleteTenantUseCase } from "../abstractions.js";

// TODO: This decorator will be implemented in @webiny/api-wcp package
// It will wrap DeleteTenantUseCase and:
// 1. Execute the deletion
// 2. Call decrementWcpTenants() after successful deletion

export class DeleteTenantWithWcpDecrement implements DeleteTenantUseCase.Interface {
    constructor(
        private decoratee: DeleteTenantUseCase.Interface,
        private decrementWcpTenants: () => Promise<void>
    ) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.decoratee.execute(id);
        await this.decrementWcpTenants();
        return result;
    }
}
