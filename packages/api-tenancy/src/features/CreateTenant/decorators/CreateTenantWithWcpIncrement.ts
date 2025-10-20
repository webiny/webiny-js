import { WcpContext } from "@webiny/api-wcp/features/WcpContext";
import { createDecorator } from "@webiny/feature/api";
import { CreateTenantUseCase } from "../abstractions.js";
import type { CreateTenantInput } from "~/types.js";

class CreateTenantWithWcpIncrementImpl implements CreateTenantUseCase.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: CreateTenantUseCase.Interface
    ) {}

    async execute(data: CreateTenantInput) {
        await this.wcp.incrementTenants();

        const result = await this.decoratee.execute(data);

        if (result.isFail()) {
            await this.wcp.decrementTenants();
        }

        return result;
    }
}

export const CreateTenantWithWcpIncrement = createDecorator({
    abstraction: CreateTenantUseCase,
    decorator: CreateTenantWithWcpIncrementImpl,
    dependencies: [WcpContext]
});
