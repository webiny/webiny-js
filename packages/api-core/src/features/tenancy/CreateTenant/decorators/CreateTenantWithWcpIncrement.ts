import { createDecorator } from "@webiny/feature/api";
import { CreateTenantUseCase } from "../abstractions.js";
import type { CreateTenantInput } from "~/types/tenancy.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

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
