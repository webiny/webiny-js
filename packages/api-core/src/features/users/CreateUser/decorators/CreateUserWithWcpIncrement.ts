import { WcpContext } from "@webiny/api-wcp/features/WcpContext";
import { createDecorator } from "@webiny/feature/api";
import { CreateUserUseCase } from "../abstractions.js";
import type { CreateUserInput } from "~/features/users/shared/types.js";

class CreateUserWithWcpIncrementImpl implements CreateUserUseCase.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: CreateUserUseCase.Interface
    ) {}

    async execute(input: CreateUserInput) {
        await this.wcp.incrementSeats();

        const result = await this.decoratee.execute(input);

        if (result.isFail()) {
            await this.wcp.decrementSeats();
        }

        return result;
    }
}

export const CreateUserWithWcpIncrement = createDecorator({
    abstraction: CreateUserUseCase,
    decorator: CreateUserWithWcpIncrementImpl,
    dependencies: [WcpContext]
});
