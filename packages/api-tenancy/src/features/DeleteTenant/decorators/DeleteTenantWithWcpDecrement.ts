import { WcpContext } from "@webiny/api-wcp/features/WcpContext";
import { createDecorator } from "@webiny/feature/api";
import { DeleteTenantUseCase } from "../abstractions.js";

class DeleteTenantWithWcpDecrementImpl implements DeleteTenantUseCase.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: DeleteTenantUseCase.Interface
    ) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.decoratee.execute(id);
        await this.wcp.decrementTenants();
        return result;
    }
}

export const DeleteTenantWithWcpDecrement = createDecorator({
    abstraction: DeleteTenantUseCase,
    decorator: DeleteTenantWithWcpDecrementImpl,
    dependencies: [WcpContext]
});
