import { createFeature } from "@webiny/feature/api";
import { DeleteUserUseCase } from "./DeleteUserUseCase.js";
import { DeleteUserWithWcpDecrement } from "./decorators/DeleteUserWithWcpDecrement.js";

export const DeleteUserFeature = createFeature({
    name: "DeleteUser",
    register(container) {
        container.register(DeleteUserUseCase);
        container.registerDecorator(DeleteUserWithWcpDecrement);
    }
});
