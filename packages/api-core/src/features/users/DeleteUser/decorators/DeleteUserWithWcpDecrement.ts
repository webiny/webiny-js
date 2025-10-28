import { createDecorator } from "@webiny/feature/api";
import { DeleteUserUseCase } from "../abstractions.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

class DeleteUserWithWcpDecrementImpl implements DeleteUserUseCase.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: DeleteUserUseCase.Interface
    ) {}

    async execute(id: string) {
        const result = await this.decoratee.execute(id);

        // Only decrement seats if deletion was successful
        if (result.isOk()) {
            await this.wcp.decrementSeats();
        }

        return result;
    }
}

export const DeleteUserWithWcpDecrement = createDecorator({
    abstraction: DeleteUserUseCase,
    decorator: DeleteUserWithWcpDecrementImpl,
    dependencies: [WcpContext]
});
